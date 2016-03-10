var async = require('async');
var MyError = require('../../error/index').MyError;
var UserError = require('../../error/index').UserError;
var UserOk = require('../../error/index').UserOk;

var funcs = require('../../libs/functions');
var Table = require('./Table');
var api = require('../../libs/api');
var rollback = require('../../modules/rollback');

/**
 * Функция конструктор, создает стандартную модель для работы с таблицами в Mysql
 * Имеет стандартные методы get/add/modify/remove
 * @obj params {}
 * Обязательным параметром явл. params.name (содержит имя класса из которого формируется имя таблицы в mySQL)
 table_ru Русское наименование таблицы, для формирования текста ошибок.
 ending окончание в тексте ошибок (объект удален/удалена/удалено) // 'о' 'а' ''
 required_fields = массив обязательных полей. Если при добавлении эти поля не переданы, функция add вернет ош. об этом
 not_insertable = массив содержащий имена полей, запрещенных к редактированию. В этот массив всегда добавляется 'created'
 this.blob_fields Массив полей которые хронятся в двоичном виде и требуют форматирования после получения.
 this.defaults = Массив объектов, значения по умолчанию
 * @returns {boolean}
 * @constructor
 */
var MySQLModel = function (obj) {
    console.log('creating new MySQLModel ....');
    var _t = this;
    if (typeof obj !== 'object') {
        throw new MyError('Не верно вызвана функция конструктор в MySQLModel.js');
    }
    _t.tableName = obj.name.toLowerCase();
    _t.user = obj.user || {sid:'0'};
    _t.name = obj.name;
    _t.data_cache_alias = obj.name + '_' +(obj.client_object || '0')+ '_' + _t.user.sid;
    _t.client_object = obj.client_object;
    _t.cache = {};
    _t.columns = [];
    _t.uniqueColumns = [];
    _t.required_fields = [];
    _t.not_insertable = ['created'];
    _t.validation = {};

    this.validationFormats = {
        notNull: {
            format: '<значение>',
            example: 'строка, число, дата...'
        },
        number: {
            format: '<число>',
            example: '10'
        },
        url: {
            format: '<Протокол>://<адрес>',
            example: 'http://example.ru'
        },
        email: {
            format: '<Имя>@<домен>',
            example: 'user@example.ru'
        }
    };
    this.beforeFunction = {
        get: function (obj, cb) {
            cb(null, null);
        },
        add: function (obj, cb) {
            cb(null, null);
        },
        modify: function (obj, cb) {
            cb(null, null);
        },
        remove: function (obj, cb) {
            cb(null, null);
        }
    };
    this.prepareResult = function (rows, profile) {
        for (var i in rows) {
            // Берем тип данных для этого поля и преобразуем null -> '', 1/0 --> true/false
            if (typeof profile[i] != 'object') continue;
            if (rows[i] === null && profile[i].type !== 'tinyint') {
                rows[i] = '';
                continue;
            }

            if (profile[i].type == 'tinyint' && profile[i].field_length == 1) rows[i] = !!rows[i];
        }
        return rows;
    };
    this.getFormatingFunc = function (rows) {
        if (!Array.isArray(rows)) {
            var isSingleValue = true;
            rows = [rows];
        }
        var formatData = function (field, field_type, profile) {
            var formatFuncName = profile.get_formating || (function () {
                    switch (field_type) {
                        case "date":
                            return 'userFriendlyDate';
                            break;
                        case "datetime":
                            return 'userFriendlyDateTime';
                            break;
                        case "blob":
                        case "mediumblob":
                        case "longblob":
                            return 'parseBlob';
                            break;
                        case "tinyint":
                            return (profile.field_length == 1) ? 'parseBool' : null;
                            break;
                        default :
                            return null;
                            break;
                    }
                })();
            if (formatFuncName) {
                if (typeof funcs[formatFuncName] == 'function') return funcs[formatFuncName](field);
            }
            return field;
        };
        for (var i in rows) {
            /*if (rows[i].name.indexOf('MySQLvariable')!==-1) {
             delete rows[i];
             continue;
             }*/
            var row = rows[i];
            for (var j in row) {
                if (row[j] === null) row[j] = '';
                var field = row[j];
                if (j.indexOf('MySQLvariable') > -1) {
                    delete rows[i][j];
                    continue;
                }
                var profile = _t.class_fields_profile[j];
                var field_type = profile.type;
                rows[i][j] = formatData(field, field_type, profile);
            }
        }
        return (isSingleValue) ? (rows.length) ? rows[0] : [] : rows;
    };
    this.setFormatingFunc = function (row) {
        for (var i in row) {
            var field = row[i];
            if (field === null) continue;
            var profile = _t.class_fields_profile[i];
            var field_type = profile.type;
            var formatFuncName = profile.set_formating || (function () {
                    switch (field_type) {
                        case "date":
                            return 'getDateMySQL';
                            break;
                        case "datetime":
                            return 'getDateTimeMySQL';
                            break;
                        case "int":
                        case "bigint":
                            if (field === '') row[i] = null;
                            return null;
                            break;
                        default :
                            return null;
                            break;
                    }
                })();
            if (formatFuncName) {
                if (typeof funcs[formatFuncName] == 'function') row[i] = funcs[formatFuncName](field);
            }
        }
        return row;
    };
    this.loadDefaultValues = function (obj, cb, additional_params) {

        if (typeof additional_params !== 'object') additional_params = {};
        var standart = additional_params.standart;
        var virtual = additional_params.virtual || true;
        if (standart) {
            // загрузим стандартные значения
            for (var i in _t.class_fields_profile) {
                var colProfile = _t.class_fields_profile[i];
                var columnName = colProfile.column_name;
                if (typeof colProfile !== 'object') continue;
                var colValue = obj[columnName];
                if (typeof colValue === 'undefined' && colProfile.default_value && !colProfile.virtual) {
                    obj[columnName] = colProfile.default_value;
                }
            }
        }
        if (!virtual) return cb(null, obj);
        // Загрузим значения по умолчанию для virtual полей
        async.eachSeries(_t.class_fields_profile, function (item, cb) {
            var columnName = item.column_name;
            if (typeof item !== 'object') return cb(new MyError('Не удалось получить профайл колонки...', i));
            var colValue = obj[columnName];
            if (typeof colValue === 'undefined' && item.virtual && item.default_value) {
                // Загрузим необходимый default
                if (typeof obj[item.keyword] !== 'undefined') return cb(null);
                var o = {
                    command: 'get',
                    object: item.from_table,
                    params: {
                        columns: ['id'],
                        collapseData: false,
                        where: [
                            {
                                key: 'sysname',
                                val1: item.default_value
                            }
                        ]
                    }
                };
                _t.api(o, function (err, res) {

                    if (err || typeof res !== 'object') {
                        console.log('Не удалось получить значение по умолчанию для поля ' + columnName, err, res);
                        return cb(null);
                    }
                    if (!res.length) {
                        console.log('Нет записей в ' + item.from_table + 'с sysname = ' + item.default_value + ' для поля ' + columnName);
                        return cb(null);
                    }
                    obj[item.keyword] = res[0].id;
                    cb(null);
                })
            } else if (typeof colValue === 'undefined' && item.default_value) {
                obj[columnName] = item.default_value;
                return cb(null);
            } else {
                cb(null);
            }
        }, function (err) {
            return cb(err, obj);
        });
    }
};

MySQLModel.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    // Выполним инициализацию MySQLModel
    async.series([
        function (cb) {
            if (!global.MySQLModel_profile) {
                global.MySQLModel_profile = {};
            }
            _t.profile_fields = global.MySQLModel_profile.profile_fields;
            _t.fields_profile_fields = global.MySQLModel_profile.fields_profile_fields;
            _t.co_profile_fields = global.MySQLModel_profile.co_profile_fields;
            _t.co_fields_profile_fields = global.MySQLModel_profile.co_fields_profile_fields;
            async.series([
                function (cb) {
                    if (typeof _t.profile_fields == 'object') return cb(null); // Уже загружен
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.queryValue("SELECT id FROM class_profile WHERE name = 'class_profile'", function (err, value) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось получить id для class_profile'));
                                if (!value) return cb(new MyError("Нет id для class_profile в таблице class_profile"));
                                _t.class_profile_id = global.MySQLModel_profile.class_profile_id = value;
                                return cb(null);
                            })
                        },
                        pool.getConn,
                        function (conn, cb) {
                            conn.select("class_fields_profile", '*', {class_id: _t.class_profile_id}, function (err, res) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось загрузить профиль таблицы.', {
                                    tableName: "class_fields",
                                    err: err
                                }));
                                if (res.length == 0) return cb(new MyError('Нет профиля для этой таблицы..', {tableName: "class_fields"}));
                                _t.profile_fields = {};
                                for (var i in res) {
                                    _t.profile_fields[res[i].column_name] = res[i];
                                }
                                global.MySQLModel_profile.profile_fields = _t.profile_fields;
                                cb(null);
                            });
                        }
                    ], cb);
                },
                function (cb) {
                    if (typeof _t.fields_profile_fields == 'object') return cb(null); // Уже загружен
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.queryValue("SELECT id FROM class_profile WHERE name = 'class_fields_profile'", function (err, value) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось получить id для class_profile'));
                                if (!value) return cb(new MyError("Нет id для class_profile в таблице class_profile"));
                                _t.class_profile_fields_id = global.MySQLModel_profile.class_profile_fields_id = value;
                                return cb(null);
                            })
                        },
                        pool.getConn,
                        function (conn, cb) {
                            conn.select("class_fields_profile", '*', {class_id: _t.class_profile_fields_id}, function (err, res) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось загрузить профиль таблицы.', {
                                    tableName: "class_fields_profile",
                                    err: err
                                }));
                                if (res.length == 0) return cb(new MyError('Нет профиля для этой таблицы..', {tableName: "class_fields_profile"}));
                                _t.fields_profile_fields = {};
                                for (var i in res) {
                                    _t.fields_profile_fields[res[i].column_name] = res[i];
                                }
                                global.MySQLModel_profile.fields_profile_fields = _t.fields_profile_fields;
                                cb(null);
                            });
                        }
                    ], cb);
                },
                function (cb) {
                    if (typeof _t.co_profile_fields == 'object') return cb(null); // Уже загружен
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.queryValue("select id from class_profile where name = 'client_object_profile'", function (err, value) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось получить id для client_object_profile'));
                                if (!value) return cb(new MyError("Нет id для client_object_profile в таблице class_profile"));
                                _t.co_profile_id = global.MySQLModel_profile.co_profile_id = value;
                                return cb(null);
                            })
                        },
                        pool.getConn,
                        function (conn, cb) {
                            conn.select("class_fields_profile", '*', {class_id: _t.co_profile_id}, function (err, res) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось загрузить профиль таблицы.', {
                                    tableName: "class_fields_profile",
                                    err: err
                                }));
                                if (res.length == 0) return cb(new MyError('Нет профиля для этой таблицы..', {tableName: "class_fields"}));
                                _t.co_profile_fields = {};
                                for (var i in res) {
                                    _t.co_profile_fields[res[i].column_name] = res[i];
                                }
                                global.MySQLModel_profile.co_profile_fields = _t.co_profile_fields;
                                cb(null);
                            });
                        }
                    ], cb);
                },
                function (cb) {

                    if (typeof _t.co_fields_profile_fields == 'object') return cb(null); // Уже загружен
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.queryValue("SELECT id FROM class_profile WHERE name = 'client_object_fields_profile'", function (err, value) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось получить id для client_object_fields_profile'));
                                if (!value) return cb(new MyError("Нет id для client_object_fields_profile в таблице class_profile"));
                                _t.co_profile_fields_id = global.MySQLModel_profile.co_profile_fields_id = value;
                                return cb(null);
                            })
                        },
                        pool.getConn,
                        function (conn, cb) {
                            //conn.select("client_object_fields_profile",'*', {client_object_id:_t.co_profile_fields_id}, function (err, res) {
                            conn.select("class_fields_profile", '*', {class_id: _t.co_profile_fields_id}, function (err, res) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось загрузить профиль таблицы.', {
                                    tableName: "co_fields_profile_fields",
                                    err: err
                                }));
                                if (res.length == 0) return cb(new MyError('Нет профиля для этой таблицы..', {tableName: "co_fields_profile_fields"}));
                                _t.co_fields_profile_fields = {};
                                for (var i in res) {
                                    _t.co_fields_profile_fields[res[i].column_name] = res[i];
                                }
                                global.MySQLModel_profile.co_fields_profile_fields = _t.co_fields_profile_fields;
                                cb(null);
                            });
                        }
                    ], cb);
                }
            ], cb);
        },
        function (cb) {
            // Проверим существование таблицы
            _t.table = new Table({params: {name: _t.tableName, user:_t.user}});
            if (_t.table instanceof MyError) return cb(_t.table);
            // Не будем вызывать функцию init так как нам не нужно загружать структуру из файла.
            _t.table.checkExist(function (err, info) {
                if (err) {
                    return cb(err);
                }
                if (!info) {
                    return cb(new MyError('Таблица в базе еще не создана', {table: _t.tableName}));
                }
                cb(null);
            });
        }, function (cb) {
            // Загрузим профайл таблицы
            async.waterfall([
                pool.getConn,
                function (conn, cb) {
                    // Выполним запрс и запишим результат
                    conn.select("class_profile", '*', {name: _t.tableName}, function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Не удалось загрузить профиль таблицы.', {
                            tableName: _t.tableName,
                            err: err
                        }));
                        if (res.length == 0) return cb(new MyError('Нет профиля для этой таблицы..', {tableName: _t.tableName}));
                        if (res.length > 1) return cb(new MyError('База содержит более одного профиля.', {
                            tableName: _t.tableName,
                            res: res
                        }));
                        _t.class_profile = _t.prepareResult(res[0], _t.profile_fields);
                        _t.class_profile.primary_key = _t.class_profile.primary_key || 'id';
                        _t.class_profile.prepare_insert = '';
                        cb(null);
                    });
                },
                pool.getConn,
                function (conn, cb) {
                    // Обновляем класс профайл на основе профайла клиентского объекта
                    // Загрузим профайл клиентского объекта
                    if (!_t.client_object) {
                        conn.release();
                        return cb(null);
                    }


                    //conn.select("client_object_profile",'*', {name:_t.client_object}, function (err, res) {
                    //    conn.release();
                    //    if (err) return cb(new MyError('Не удалось загрузить профиль клиентского объекта.',{client_object:_t.client_object, err:err}));
                    //    //if (res.length == 0) return cb(new MyError('Нет профиля для этого клиентского объекта..',{client_object:_t.client_object}));
                    //    if (res.length > 1) return cb(new MyError('База содержит более одного профиля.',{client_object:_t.client_object,res:res}));
                    //    _t.client_object_profile = _t.prepareResult(res[0], _t.co_profile_fields);
                    //    var excludeCols = ['id','published','deleted','created','updated'/*,'name'*/];
                    //    for (var i in _t.client_object_profile) {
                    //        if (excludeCols.indexOf(i)!==-1) continue;
                    //        _t.class_profile[i] = _t.client_object_profile[i];
                    //    }
                    //    cb(null);
                    //});

                    var ready_columns = [];
                    var join_tables = [];
                    var join_tables_list = [];
                    var tableName = 'client_object_profile';
                    var from_table_counter = {};
                    for (var col in _t.co_profile_fields) {
                        var colProfile = _t.co_profile_fields[col];
                        if (colProfile.virtual && colProfile.concat_fields) continue; // Пропускаем concat_fields
                        if (!colProfile.virtual) {
                            ready_columns.push(tableName + '.' + col);
                            continue;
                        }
                        if (!from_table_counter[colProfile.from_table]) from_table_counter[colProfile.from_table] = 1;
                        colProfile.from_table_alias = colProfile.from_table + from_table_counter[colProfile.from_table]++;
                        join_tables.push(' LEFT JOIN ' + colProfile.from_table + ' as ' + colProfile.from_table_alias + ' ON ' + tableName + '.' + colProfile.keyword + ' = ' + colProfile.from_table_alias + '.id');
                        ready_columns.push((colProfile.from_table_alias || colProfile.from_table) + '.' + colProfile.return_column + ' as ' + col);
                        _t.co_profile_fields[col].from_table_alias = colProfile.from_table_alias;
                    }
                    var sql = "SELECT " + ready_columns.join(', ') + " FROM " + tableName + join_tables.join('') + ' WHERE ' +
                        tableName + ".name = " + pool.escape(_t.client_object) + " AND " + tableName + ".class_id = " + pool.escape(_t.class_profile.id);
                    console.log(sql);
                    //conn.select("client_object_profile",'*', {name:_t.client_object, class_id:_t.class_profile.id}, function (err, res) {
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Не удалось загрузить профиль клиентского объекта.', {
                            client_object: _t.client_object,
                            err: err
                        }));
                        //if (res.length == 0) return cb(new MyError('Нет профиля для этого клиентского объекта..',{client_object:_t.client_object}));
                        if (res.length > 1) return cb(new MyError('База содержит более одного профиля.', {
                            client_object: _t.client_object,
                            res: res
                        }));
                        _t.client_object_profile = _t.prepareResult(res[0], _t.co_profile_fields);
                        var excludeCols = ['id', 'published', 'deleted', 'created', 'updated'/*,'name'*/];
                        for (var i in _t.client_object_profile) {
                            if (excludeCols.indexOf(i) !== -1) continue;
                            _t.class_profile[i] = _t.client_object_profile[i];
                        }
                        cb(null);
                    });
                }
                //function (conn, cb) {
                //    // Обновляем класс профайл на основе профайла клиентского объекта
                //    // Загрузим профайл клиентского объекта
                //    if (!_t.client_object){
                //        conn.release();
                //        return cb(null);
                //    }
                //
                //    var ready_columns = [];
                //    var join_tables = [];
                //    var join_tables_list = [];
                //    var tableName = 'client_object_profile';
                //    var from_table_counter = {};
                //    for (var col in _t.co_fields_profile_fields) {
                //        var colProfile = _t.co_fields_profile_fields[col];
                //        if (colProfile.virtual && colProfile.concat_fields) continue; // Пропускаем concat_fields
                //        if (!colProfile.virtual) {
                //            ready_columns.push(tableName + '.' + col);
                //            continue;
                //        }
                //        if (!from_table_counter[colProfile.from_table]) from_table_counter[colProfile.from_table] = 1;
                //        colProfile.from_table_alias = colProfile.from_table + from_table_counter[colProfile.from_table]++;
                //        join_tables.push(' LEFT JOIN ' + colProfile.from_table + ' as ' + colProfile.from_table_alias + ' ON ' + tableName + '.' + colProfile.keyword + ' = ' + colProfile.from_table_alias + '.id');
                //        ready_columns.push((colProfile.from_table_alias || colProfile.from_table) + '.' + colProfile.return_column + ' as ' + col);
                //        _t.co_fields_profile_fields[col].from_table_alias = colProfile.from_table_alias;
                //    }
                //    var sql = "SELECT " + ready_columns.join(', ') + " FROM " + tableName + join_tables.join('') + ' WHERE ' +
                //        tableName +".name = "+ pool.escape(_t.client_object) +" AND "+ tableName +".class_id = " +pool.escape(_t.class_profile.id);
                //
                //    console.log(sql);
                //    //conn.select("client_object_profile",'*', {name:_t.client_object, class_id:_t.class_profile.id}, function (err, res) {
                //    conn.query(sql, function (err, res) {
                //        conn.release();
                //        if (err) return cb(new MyError('Не удалось загрузить профиль клиентского объекта.',{client_object:_t.client_object, err:err}));
                //        //if (res.length == 0) return cb(new MyError('Нет профиля для этого клиентского объекта..',{client_object:_t.client_object}));
                //        if (res.length > 1) return cb(new MyError('База содержит более одного профиля.',{client_object:_t.client_object,res:res}));
                //        _t.client_object_profile = _t.prepareResult(res[0], _t.co_profile_fields);
                //        var excludeCols = ['id','published','deleted','created','updated'/*,'name'*/];
                //        for (var i in _t.client_object_profile) {
                //            if (excludeCols.indexOf(i)!==-1) continue;
                //            _t.class_profile[i] = _t.client_object_profile[i];
                //        }
                //        cb(null);
                //    });
                //}
            ], cb)
        },
        function (cb) {
            // Загрузим профайл полей таблицы
            async.waterfall([
                pool.getConn,
                function (conn, cb) {
                    // Выполним запрс и запишим результат
                    var ready_columns = [];
                    var join_tables = [];
                    var join_tables_list = [];
                    var tableName = 'class_fields_profile';
                    var from_table_counter = {};
                    for (var col in _t.fields_profile_fields) {
                        var colProfile = _t.fields_profile_fields[col];
                        if (colProfile.virtual && colProfile.concat_fields) continue; // Пропускаем concat_fields
                        if (!colProfile.virtual) {
                            ready_columns.push(tableName + '.' + col);
                            continue;
                        }
                        if (!from_table_counter[colProfile.from_table]) from_table_counter[colProfile.from_table] = 1;
                        colProfile.from_table_alias = colProfile.from_table + from_table_counter[colProfile.from_table]++;
                        join_tables.push(' LEFT JOIN ' + colProfile.from_table + ' as ' + colProfile.from_table_alias + ' ON ' + tableName + '.' + colProfile.keyword + ' = ' + colProfile.from_table_alias + '.id');
                        ready_columns.push((colProfile.from_table_alias || colProfile.from_table) + '.' + colProfile.return_column + ' as ' + col);
                        _t.fields_profile_fields[col].from_table_alias = colProfile.from_table_alias;
                    }
                    var sql = "SELECT " + ready_columns.join(', ') + " FROM " + tableName + join_tables.join('') + ' WHERE class_id = ' + pool.escape(_t.class_profile.id) + ' ORDER BY sort_no';
                    //console.log(sql);
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Не удалось загрузить профиль ПОЛЕЙ таблицы.', {
                            tableName: tableName,
                            err: err
                        }));
                        if (res.length == 0) {
                            return cb(new MyError('Нет профиля ПОЛЕЙ для этой таблицы..', {tableName: tableName}));
                        }
                        var class_fields_profile = {};
                        for (var i in res) {
                            class_fields_profile[res[i].column_name] = _t.prepareResult(res[i], _t.fields_profile_fields);
                            _t.columns.push(res[i].column_name);

                            if (class_fields_profile[res[i].column_name].concat_fields) {
                                class_fields_profile[res[i].column_name].concat_array = class_fields_profile[res[i].column_name].concat_fields.match(/(\S+|\s+)/ig);
                            }
                            class_fields_profile[res[i].column_name].lov_return_to_column = class_fields_profile[res[i].column_name].lov_return_to_column || class_fields_profile[res[i].column_name].keyword || '';
                        }
                        _t.class_fields_profile = class_fields_profile;
                        cb(null);
                    });
                },
                pool.getConn,
                function (conn, cb) {
                    if (!_t.client_object_profile) {
                        conn.release();
                        return cb(null);
                    }

                    var ready_columns = [];
                    var join_tables = [];
                    var join_tables_list = [];
                    var tableName = 'client_object_fields_profile';
                    var from_table_counter = {};
                    for (var col in _t.fields_profile_fields) {
                        var colProfile = _t.fields_profile_fields[col];
                        if (colProfile.virtual && colProfile.concat_fields) continue; // Пропускаем concat_fields
                        if (!colProfile.virtual) {
                            ready_columns.push(tableName + '.' + col);
                            continue;
                        }
                        if (!from_table_counter[colProfile.from_table]) from_table_counter[colProfile.from_table] = 1;
                        colProfile.from_table_alias = colProfile.from_table + from_table_counter[colProfile.from_table]++;
                        join_tables.push(' LEFT JOIN ' + colProfile.from_table + ' as ' + colProfile.from_table_alias + ' ON ' + tableName + '.' + colProfile.keyword + ' = ' + colProfile.from_table_alias + '.id');
                        ready_columns.push((colProfile.from_table_alias || colProfile.from_table) + '.' + colProfile.return_column + ' as ' + col);
                        _t.fields_profile_fields[col].from_table_alias = colProfile.from_table_alias;
                    }
                    var sql = "SELECT " + ready_columns.join(', ') + " FROM " + tableName + join_tables.join('') + ' WHERE client_object_id = ' + pool.escape(_t.client_object_profile.id) + ' ORDER BY sort_no';
                    //console.log(sql);
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Не удалось загрузить профиль ПОЛЕЙ клиентского объекта.', {
                            client_object: _t.client_object,
                            err: err
                        }));
                        var client_object_fields_profile = {};
                        for (var i in res) {
                            client_object_fields_profile[res[i].column_name] = _t.prepareResult(res[i], _t.fields_profile_fields);
                            if (client_object_fields_profile[res[i].column_name].concat_fields) {
                                client_object_fields_profile[res[i].column_name].concat_array = client_object_fields_profile[res[i].column_name].concat_fields.match(/(\S+|\s+)/ig);
                            }
                            client_object_fields_profile[res[i].column_name].lov_return_to_column = client_object_fields_profile[res[i].column_name].lov_return_to_column || client_object_fields_profile[res[i].column_name].keyword || '';
                        }
                        var excludeCols = [/*'id','published','deleted','created','updated'*/];
                        var needReSort;
                        for (var i in client_object_fields_profile) {
                            if (typeof _t.class_fields_profile[i] === 'object') {
                                if (!needReSort && _t.class_fields_profile[i].sort_no !== client_object_fields_profile[i].sort_no) {
                                    needReSort = true;
                                }
                            } else {
                                needReSort = true;
                            }
                            if (excludeCols.indexOf(i) !== -1) continue;
                            _t.class_fields_profile[i] = client_object_fields_profile[i];
                        }
                        if (needReSort) { // Пересортируем объект согласно sort_no клиентского объекта
                            // Пройтись по class_fields_profile первратить его в массив объектов, отсортировать и выстроить новый объект объектов
                            var class_fields_profile_arr = [];
                            for (var i in _t.class_fields_profile) {
                                class_fields_profile_arr.push(_t.class_fields_profile[i]);
                            }
                            class_fields_profile_arr = class_fields_profile_arr.sort(function (a, b) {
                                if (a.sort_no > b.sort_no) return 1;
                                if (a.sort_no < b.sort_no) return -1;
                                return 0;
                            });
                            var new_obj = {};
                            for (var j in class_fields_profile_arr) {
                                new_obj[class_fields_profile_arr[j].column_name] = class_fields_profile_arr[j];
                            }
                            _t.class_fields_profile = new_obj;
                        }

                        _t.client_object_fields_profile = client_object_fields_profile;
                        // Переопределим колонки
                        _t.columns = [];
                        for (var j in _t.class_fields_profile) {
                            _t.columns.push(_t.class_fields_profile[j].column_name);
                        }
                        cb(null);
                    });
                }
            ], cb)
        },
        function (cb) {
            // Сформируем необходимые поля profile и fields_profile

            //------------------ПРОФИЛЬ ТАБЛИЦЫ------------------
            _t.table_ru = _t.class_profile.name_ru || _t.class_profile.name || '';
            _t.ending = _t.class_profile.ending || ''; // 'о' 'а'
            _t.check_published = _t.class_profile.check_published;
            _t.auto_publish = _t.class_profile.auto_publish;
            _t.distinct = _t.class_profile.distinct; /// Вероятнее всего работает некорректно
            _t.use_cache = _t.class_profile.use_cache;

            if (_t.class_profile.default_where) {
                try {
                    var old = _t.default_where;
                    _t.default_where = JSON.parse(_t.class_profile.default_where);
                    if (!_t.default_where.length) _t.default_where = old;
                } catch (e) {
                    console.log('_t.class_profile.default_where имеет не валидный JSON');
                }
            }
            if (!_t.default_where) _t.default_where = [];


            var default_order_by = _t.class_profile.default_order_by;
            if (default_order_by) {
                var o = default_order_by.match(/\S+/ig);
                var columnsTmp = o[0].split(',');
                var columns;
                for (var i in columnsTmp) {
                    if (_t.columns.indexOf(columnsTmp[i]) !== -1) {
                        if (!columns) columns = [];
                        columns.push(columnsTmp[i]);
                    }
                }
                if (!columns) columns = (_t.columns.indexOf('sort_no' !== -1)) ? ['sort_no'] : [];
                _t.sort = {
                    columns: columns,
                    direction: o[1] || 'ASC'
                }
            }
            for (var i in _t.class_fields_profile) {
                var field = _t.class_fields_profile[i];
                if (field.required) _t.required_fields.push(i);
                if (!field.insertable) _t.not_insertable.push(i);
                if (field.validation && i !== 'id') _t.validation[i] = field.validation;
            }

            _t.loadUnique();
            return cb(null);
        }
    ], function (err, res) {
        if (err) {
            console.log(err);
        }
        cb(err, res);
    });

};

MySQLModel.prototype.api = function (o, cb) {
    api(o, cb, this.user);
};

MySQLModel.prototype.loadUnique = function () {
    var _t = this;
    for (var i in _t.class_fields_profile) {
        var colProfile = _t.class_fields_profile[i];
        var column_name = colProfile.column_name;
        if (colProfile.is_unique) { // Запишим уникальные поля
            if (_t.uniqueColumns.indexOf(column_name) == -1) _t.uniqueColumns.push(column_name);
        }
    }
    return _t.uniqueColumns;
};

MySQLModel.prototype.getProfile = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод getProfile не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод getProfile не переданы params'));
    var data_columns = [];
    var data = [];
    /* for (var key in _t.fields_profile_fields) {
     data_columns.push(key);
     }*/
    var parent_key;
    var idx = 0;
    for (var i in _t.class_fields_profile) {
        var field_profile = _t.class_fields_profile[i];
        // Соберем дата_колумнс
        if (idx === 0) {
            for (var k in field_profile) {
                data_columns.push(k);
            }

        }
        data[idx] = [];
        for (var j in field_profile) {
            if (j == 'parent_key' && field_profile[j]) {
                parent_key = field_profile.column_name;
            }
            data[idx].push(field_profile[j]);
        }
        idx++;
    }
    _t.class_profile.parent_key = _t.class_profile.parent_key || parent_key || '';
    _t.class_profile.class = _t.class_profile.class || _t.class_profile.name;
    var o = {
        data_columns: data_columns,
        data: data,
        extra_data: {
            object_profile: _t.class_profile
        }
    };
    return cb(null, o);
};

MySQLModel.prototype.setColumnPosition = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод setColumnPosition не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод setColumnPosition не переданы params'));
    var column = params.column;
    var position = +params.position;
    if (!column || isNaN(position)) return cb(new MyError('В параметрах должно быть передано: название колонки (column:<строка>) и позиция(position:<число>)'));
    //column = pool.escape(column);
    var table_name = (params.client_object) ? 'client_object_fields_profile' : 'class_fields_profile';
    var old_sort_no;
    async.waterfall([
        pool.getConn,
        function (conn, cb) {
            conn.queryValue('SELECT sort_no FROM ' + table_name + ' WHERE class_id = ? AND column_name = ?', [_t.class_profile.id, column], function (err, value) {
                conn.release();
                if (err) return cb(new MyError('Не удалось получить текущую позицию столбца.', err));
                old_sort_no = value || 1;
                return cb(null);
            })
        },
        pool.getConn,
        function (conn, cb) {
            conn.query('UPDATE ' + table_name + ' SET sort_no = ? WHERE class_id = ? AND column_name = ?', [position, _t.class_profile.id, column], function (err, affected) {
                conn.release();
                if (err) return cb(new MyError('Во время установки позиции колонки возникла ошибка.', err));
                if (!affected) return cb(new UserError('В профайле не найден такой столбец.', {
                    column: column,
                    class_name: _t.name
                }));
                return cb(null);
            })
        },
        pool.getConn,
        function (conn, cb) {
            // сместим остальные столбцы
            var sql = 'UPDATE ' + table_name + ' SET sort_no = sort_no+1 WHERE class_id = ? AND column_name <> ? AND sort_no >= ? AND sort_no <= ?';
            var values = [_t.class_profile.id, column, position, old_sort_no];
            if (position > old_sort_no) {
                sql = 'UPDATE ' + table_name + ' SET sort_no = sort_no-1 WHERE class_id = ? AND column_name <> ? AND sort_no >= ? AND sort_no <= ?';
                var values = [_t.class_profile.id, column, old_sort_no, position];
            }
            conn.query(sql, values, function (err, affected) {
                conn.release();
                if (err) return cb(new MyError('Во время смещения последующих колонок возникла ошибка.', err));
                return cb(null);
            })
        }
    ], function (err) {
        if (err) return cb(err);
        async.series([
            function (cb) {
                // Очистим кеш для профиля
                var o = {
                    command: '_clearCache',
                    object: (params.client_object) ? 'client_object_fields_profile' : 'class_fields_profile',
                    params:{}
                };
                _t.api(o, function (err) {
                    if (err) {
                        console.log('\nНемогу очистить кеш профиля.', err);
                    }
                    cb(null);
                });
            },
            function (cb) {
                // Очистим кеш для класса
                var o = {
                    command: '_clearCache',
                    object: _t.name
                };
                if (params.client_object) o.client_object = params.client_object;
                _t.api(o, function (err) {
                    if (err) {
                        console.log('\nНемогу очистить кеш класса.', err);
                    }
                    cb(null);
                });
            }
        ], function (err) {
            return cb(null, new UserOk('Столбец успешно перемещен'));
        });
    });

};

MySQLModel.prototype.checkUnique = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var uniqueColumns = (_t.uniqueColumns.length) ? _t.uniqueColumns : _t.loadUnique();
    var needToCheck = false;
    var originalValues;
    var countUnigue;

    async.series([
        function (cb) {
            // если есть хоть один уникальный столбец в obj
            if (obj.id) {
                for (var i in obj) {
                    if (uniqueColumns.indexOf(i) !== -1) {
                        needToCheck = true;
                        break;
                    }
                }
            } else {
                for (var i in obj) {
                    if (uniqueColumns.indexOf(i) !== -1) {
                        needToCheck = true;
                        if (!originalValues) originalValues = {};
                        originalValues[i] = obj[i];
                    }
                }
            }
            cb(null);
        },
        function (cb) {
            // Запросим текущие знчения уникальных полей
            if (!needToCheck || !uniqueColumns.length || originalValues) return cb(null);
            var o = {
                columns: uniqueColumns,
                where: [
                    {
                        key: 'id',
                        val1: obj.id
                    }
                ],
                checkUnique: false,
                collapseData: false
            };
            _t.get(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось проверить уникальность полей.', err));
                if (!res) return cb(new MyError('Не удалось проверить уникальность полей. Нет записи.'));
                for (var i in res[0]) {
                    if (!originalValues) originalValues = {};
                    originalValues[i] = res[0][i];
                }
                return cb(null);

            })
        },
        function (cb) {
            // Найдем отличия в уникальных полях и найдем проверим только для измнененных
            needToCheck = false;
            var where;
            for (var i in originalValues) {
                if (!where) where = [];
                where.push(
                    {
                        key: i,
                        val1: (typeof obj[i] !== 'undefined') ? obj[i] : originalValues[i],
                        binary: true
                    }
                );
            }
            if (!where) return cb(null);
            var o = {
                where: where
            };
            _t.getCount(o, function (err, res) {
                if (res.count) countUnigue = true;
                cb(err);
            });
        }
    ], function (err) {
        if (err) return cb(new MyError('Не удалось проверить уникальность полей.', err));
        if (countUnigue) return cb(new UserError('Такая запись уже есть.'));
        return cb(null);
    });
};

MySQLModel.prototype.getCount = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var _t = this;
    params.countOnly = true;
    _t.get(params, cb);
};

MySQLModel.prototype.get = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var user = params.user;
    delete params.user;
    var _t = this;
    var use_cache = (typeof params.use_cache !== 'undefined') ? params.use_cache : _t.use_cache;
    if (use_cache) {
        var cacheAlias = _t.data_cache_alias;

        var str = JSON.stringify(params);//.replace(/"|:|\{|\}|\,|\>|\=|\*/ig,'');
        cacheAlias += str;
        if (!global.classesCache[_t.name]) global.classesCache[_t.name] = {};
        if (global.classesCache[_t.name][cacheAlias]) {
            console.log('\n========USE_CACHE==================================================\n');
            return cb(null, global.classesCache[_t.name][cacheAlias]);
        }
        //if (_t.cache[cacheAlias]) {
        //    console.log('\n========USE_CACHE==================================================\n');
        //    return cb(null, _t.cache[cacheAlias]);
        //}
    }
    async.waterfall([
        function (cb) {

            for (var i in _t.setFormating) {
                if (typeof funcs[_t.setFormating[i]] == 'function') {
                    if (params[i]) {
                        params[i] = funcs[_t.setFormating[i]](params[i]);
                    }
                }
            }
            _t.beforeFunction['get'](params, function (err) {
                if (err) return cb(new MyError('Ошибка выполнения beforeFunction'));
                return cb(null);
            });
        },
        function (cb) {
            var param_where = [];
            for (var pkey in params.param_where) {
                var p = params.param_where[pkey];
                if (typeof p === 'string' || typeof p === 'number') {
                    param_where.push({
                        key: pkey,
                        val1: p
                    })
                }
            }
            var where = params.where || _t.where || [];
            where = where.concat(param_where);
            where = where.concat(_t.default_where);
            var limit = (isNaN(+params.limit) || params.limit === false) ? 1000 : +params.limit || 1000;

            var page_no = (isNaN(+params.page_no)) ? 1 : +params.page_no;
            var offset = (isNaN(+params.offset)) ? (limit * (page_no - 1)) : +params.offset || 0;
            var distinct = params.distinct || _t.distinct;
            if (typeof params.sort == 'string') params.sort = {columns: [params.sort], direction: 'ASC'};
            var sort = params.sort || ((_t.sort) ? funcs.cloneObj(_t.sort) : {columns: ['id'], direction: 'ASC'});
            var deleted = !!params.deleted;

            var published = (typeof params.published !== 'undefined') ? params.published : _t.check_published;
            var columns = [];
            var resultColumns = (Array.isArray(params.columns)) ? params.columns : _t.columns;
            for (var column in  resultColumns) {
                var classFieldsProfile = _t.class_fields_profile[resultColumns[column]];
                if (typeof classFieldsProfile !== 'object') continue;
                if (classFieldsProfile.queryable) {
                    columns.push(resultColumns[column]);
                }
            }
            if (!columns.length) return cb(new MyError('Нет доступных колонок.'));
            var sqlStart = '';
            //var sqlStart = "SELECT " + columns.join(', ') + " FROM " + _t.name;
            var sql = "";


            var joinObjs = funcs.cloneObj(_t.join_objs);
            var joinObjsWhere = funcs.cloneObj(_t.join_objs);

            var tmpWhere = [];
            var whereStr = '';

            var ready_columns = [];
            var join_tables = [];
            var join_tables_list = [];
            var from_table_counter = {};
            var sortColumnsReady = [];
            if (columns.indexOf(distinct) == -1) distinct = false;
            var tableName = _t.tableName;
            for (var i in columns) {
                var col = columns[i];
                if (distinct && col !== distinct) continue;
                var colProfile = _t.class_fields_profile[col];
                if (sort.columns.indexOf(col) !== -1) sortColumnsReady.push(col);
                //if (colProfile.virtual && colProfile.concat_fields) continue; // Пропускаем concat_fields
                if (!colProfile.virtual) {
                    ready_columns.push(tableName + '.' + col);
                    continue;
                }
                if (!colProfile.concat_fields) {
                    if (!from_table_counter[colProfile.from_table]) from_table_counter[colProfile.from_table] = 1;
                    colProfile.from_table_alias = colProfile.from_table + from_table_counter[colProfile.from_table]++;
                    join_tables.push(' LEFT JOIN ' + colProfile.from_table + ' as ' + colProfile.from_table_alias + ' ON ' + tableName + '.' + colProfile.keyword + ' = ' + colProfile.from_table_alias + '.id');
                    ready_columns.push((colProfile.from_table_alias || colProfile.from_table) + '.' + colProfile.return_column + ' as ' + col);
                    _t.class_fields_profile[col].from_table_alias = colProfile.from_table_alias;
                } else if (colProfile.concat_fields) {
                    var concat_array = colProfile.concat_array;
                    var s = '';
                    for (var i in concat_array) {
                        var fieldKey = concat_array[i];
                        var fieldProfile = _t.class_fields_profile[fieldKey];
                        if (!s) s = 'CONCAT(';
                        if (fieldProfile) {
                            s += fieldProfile.from_table || tableName + '.' + (fieldProfile.return_column || fieldKey) + ',';
                        } else {
                            s += "'" + fieldKey + "',";
                        }
                    }
                    s = s.replace(/,$/, ') as ') + col;
                    ready_columns.push(s);
                }


            }
            if (!sortColumnsReady.length) {
                var defaultCol = (columns.indexOf('sort_no') !== -1) ? 'sort_no' : false;
                if (defaultCol) sortColumnsReady.push(defaultCol);
            }
            sort.columns = sortColumnsReady;
            var distinctSQL = (distinct) ? 'DISTINCT ' : '';
            sqlStart = "SELECT " + distinctSQL + ready_columns.join(', ') + " FROM " + tableName;
            sql += join_tables.join('');

            where = where.sort(function (a, b) {
                if (!a.group) a.group = 'serverAutoGroup';
                if (!b.group) b.group = 'serverAutoGroup';
                if (a.group > b.group) return -1;
                if (a.group < b.group) return 1;
                return 0;
            });
            var old_group = '';
            for (var i in where) {
                var one_where = where[i];
                if (typeof  one_where !== 'object') continue;

                //var key = (table_name)? table_name+'.'+one_where.key : one_where.key;
                var columnProfile = _t.class_fields_profile[one_where.key];
                if (!columnProfile) return cb(new MyError('Нет профайла для колонки.', {
                    column: one_where.key,
                    table: tableName
                }));
                var key;
                var fromTable = columnProfile.from_table_alias || columnProfile.from_table;
                if (columnProfile.virtual && fromTable) {
                    key = fromTable;
                } else {
                    key = one_where.key;
                }
                if (!key) continue;
                if (!columns.indexOf(key) == -1) continue; // Поле недоступно
                var type = one_where.type || '=';
                var val1 = one_where.val1 || '';
                var val2 = one_where.val2 || '';
                one_where.group = one_where.group || 'default';
                var group = one_where.group.replace(/\.\w+/ig, '');
                var groupComparisonType = one_where.group.replace(/\w+\.*/, '') || 'AND';
                groupComparisonType = (groupComparisonType.toUpperCase() == 'OR') ? groupComparisonType : 'AND';
                var comparisonType = one_where.comparisonType || 'AND';
                comparisonType = comparisonType.toUpperCase();
                var binaryStr = (one_where.binary) ? 'BINARY ' : '';
                var keyString;
                if (!columnProfile.virtual) {
                    if (columnProfile.type == 'date') {
                        keyString = "DATE_FORMAT(" + tableName + '.' + key + ",'%d.%m.%Y')";
                    } else if (columnProfile.type == 'datetime') {
                        keyString = "DATE_FORMAT(" + tableName + '.' + key + ",'%d.%m.%Y %H:%i:%s')";
                    } else {
                        keyString = binaryStr + tableName + '.' + key;
                    }

                } else if (columnProfile.virtual && fromTable) {
                    keyString = binaryStr + fromTable + '.' + columnProfile.return_column;
                } else {
                    var concat_array = columnProfile.concat_array;
                    var str = '';
                    for (var i in concat_array) {
                        var fieldKey = concat_array[i];
                        var fieldProfile = _t.class_fields_profile[fieldKey];
                        if (!str) str = 'CONCAT(';
                        if (fieldProfile) {
                            str += fieldProfile.from_table || tableName + '.' + (fieldProfile.return_column || fieldKey) + ',';
                        } else {
                            str += "'" + fieldKey + "',";
                        }
                    }
                    keyString = binaryStr + str.replace(/,$/, ')');
                }
                if (typeof keyString === 'undefined') continue;
                var s = '';
                switch (type) {
                    case '=':
                    case '>':
                    case '<':
                    case '<=':
                    case '>=':
                    case '<>':
                        s = keyString + ' ' + type + ' ' + pool.escape(val1);
                        break;
                    case 'like':
                        s = keyString + ' ' + type + ' ' + pool.escape('%' + val1 + '%');
                        break;
                    case 'in':
                        var values = '';

                        if (typeof val1 !== 'object' && val1) val1 = val1.split(',');
                        for (var i in val1) {
                            values += pool.escape(val1[i]) + ',';
                        }
                        values = values.replace(/,$/, '');
                        s = keyString + ' IN (' + values + ')';
                        break;
                    case 'between':
                    case '..':
                        if (val1 && val2) { // Указаны оба значения. Используем between
                            s = keyString + " BETWEEN " + pool.escape(val1) + " AND " + pool.escape(val2) + "";
                        } else if (!val2) { // Второе значение не указано. Используем >=
                            s = keyString + " >= " + pool.escape(val1);
                        } else { // Первое значение не указано. Используем <=
                            s = keyString + " <= " + pool.escape(val2);
                        }
                        break;
                    case 'isNull':
                        s = keyString + " IS NULL ";
                        break;
                    case 'isNotNull':
                        s = keyString + " IS NOT NULL ";
                        break;
                    default :
                        continue;
                        break;
                }
                if (group != old_group) {
                    //s = (whereStr)? ') ' + groupComparisonType + ' (' + s : '(' + s;
                    whereStr = (whereStr) ? whereStr + ') ' + groupComparisonType + ' (' + s : '(' + s;
                    //whereStr = (whereStr)? whereStr + ' '+ comparisonType +' ' + s : s;
                    old_group = group;
                } else {
                    whereStr = (whereStr) ? whereStr + ' ' + comparisonType + ' ' + s : s;
                }

            }
            if (whereStr) whereStr += ')';

            //console.log('whereStr', whereStr);
            // Общее для всех
            sql += ' WHERE ';
            var whereString = whereStr;
            if (whereString !== '') {
                sql += whereString;
            }

            if (!deleted) {
                if (whereString !== '') {
                    sql += ' AND';
                }
                sql += " (" + tableName + ".deleted IS NULL OR " + tableName + ".deleted >'" + funcs.getDateTimeMySQL() + "')"
            }
            if (published) {
                if (whereString !== '' || !deleted) {
                    sql += ' AND';
                }
                published = (published === true) ? funcs.getDateTimeMySQL() : published;
                sql += " (" + tableName + ".published IS NOT NULL AND " + tableName + ".published <='" + published + "')"
            }
            var sqlCount = 'SELECT count(*) FROM ' + tableName + sql;
            if (sort.columns.length) {
                sql += ' ORDER BY ' + sort.columns.join(',') + ' ' + sort.direction;
            }
            if (limit) {
                if (offset) {
                    sql += ' LIMIT ' + offset + ', ' + limit;
                } else {
                    sql += ' LIMIT ' + limit;
                }
            }

            var realSQL = sqlStart + sql;
            console.log(realSQL);

            var count_all;

            async.waterfall([
                pool.getConn,
                function (conn, cb) {
                    if (distinct) return cb(null);
                    conn.queryValue(sqlCount, [], function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Не удалось посчитать количество записей по запросу', err));
                        count_all = res;
                        cb(null);
                    });
                },
                function (cb) {
                    if (params.countOnly) return cb(null, new UserOk('noToastr', {count: count_all}));
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.query(realSQL, [], function (err, rows) {
                                conn.release();
                                if (err) {
                                    console.log(err);
                                    return cb(err);
                                }
                                _t.getFormatingFunc(rows);
                                var res = rows;

                                if (params.collapseData !== false) {
                                    var data_columns;
                                    if (!rows.length) data_columns = _t.columns;
                                    res = funcs.collapseData(rows, {
                                        count: rows.length,
                                        count_all: (count_all || rows.length)
                                    }, data_columns);
                                } else {
                                    /*res.count = count_all;
                                     res.count_all = count_all;*/
                                }
                                cb(null, res);
                            });
                        }
                    ], cb)
                }
            ], cb);


        }
    ], function (err, results) {
        if (err) {
            return cb(err);
        }
        if (use_cache) {
            //console.log('cacheAlias',cacheAlias);
            if (!global.classesCache[_t.name]) global.classesCache[_t.name] = {};
            global.classesCache[_t.name][cacheAlias] = results;

        }
        cb(null, results);
    });
};

MySQLModel.prototype.getById = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В getById метод не передан id'));
    var o = {
        collapseData: false,
        where: [
            {
                key: 'id',
                val1: id
            }
        ]
    };
    if (Array.isArray(obj.columns)) o.columns = obj.columns;
    _t.get(o, function (err, res) {
        cb(err, res);
    });
};

MySQLModel.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var user = _t.user;
    var rollback_key;
    if (obj.rollback_key) {
        rollback_key = obj.rollback_key;
        delete obj.rollback_key;
    }
    async.waterfall([
        function (cb) {
            // Предзапрос ID из справочников по виртуальным полям
            async.eachSeries(Object.keys(obj), function (key, cb) {
                var colProfile = _t.class_fields_profile[key];
                if (typeof colProfile !== 'object') {
                    console.log('Не удалось получить профайл колонки...', key);
                    delete obj[key];
                    return cb(null);
                } // Просто игнорируем поля для которых нет профайла
                var colValue = obj[key];
                if (typeof obj[colProfile.keyword] === 'undefined' && typeof colValue !== 'undefined' && colProfile.virtual && colProfile.from_table && colProfile.keyword && colProfile.return_column) {
                    // Загрузим значение для статуса colValue
                    var o = {
                        command: 'get',
                        object: colProfile.from_table,
                        params: {
                            collapseData: false,
                            columns: ['id'],
                            where: [
                                {
                                    key: colProfile.return_column,
                                    val1: colValue
                                }
                            ]
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) {
                            console.log('Не удалось загрузить значение из справочнка', o, err);
                            delete obj[key];
                            return cb(null);
                        }
                        if (!res.length) {
                            console.log('В системе нет такого значения в связанной таблице', JSON.stringify(o));
                            return cb(null);
                        }
                        obj[colProfile.keyword] = res[0].id;
                        cb(null);
                    })
                } else cb(null);
            }, cb);
        },
        function (cb) {
            // Удалим не добавляемые поля

            for (var i in obj) {
                var colProfile = _t.class_fields_profile[i];
                //if (typeof colProfile!=='object') return cb(new MyError('Не удалось получить профайл колонки...',i));
                if (typeof colProfile !== 'object') {
                    console.log('Не удалось получить профайл колонки...', i);
                    delete obj[i];
                    continue;
                } // Просто игнорируем поля для которых нет профайла
                var colValue = obj[i];
                if ((colProfile.virtual && !colProfile.from_table) || (!colProfile.server_editable && !colProfile.server_insertable)) delete obj[i];
            }
            delete obj['id'];
            delete obj['created'];
            delete obj['deleted'];
            delete obj['updated'];
            if (Object.keys(obj).length < 1) return cb(new UserError('Поля, которые вы пытаетесь добавить не доступны для добавления.'));
            var requredNotFound = [];
            for (var j in _t.required_fields) {
                var colName = _t.required_fields[j];
                var colProfile2 = _t.class_fields_profile[colName];
                if (colProfile2.virtual) continue; // Я игнорирую requred для виртуальных полей
                if (typeof obj[colName] === 'undefined') requredNotFound.push({
                    column_name: colName,
                    name: colProfile2.name
                });
            }
            if (requredNotFound.length) {
                return cb(new UserError('requiredErr', {data: requredNotFound}));
            }

            obj = _t.setFormatingFunc(obj);
            _t.beforeFunction['add'](obj, function (err) {
                if (err) return cb(new MyError('Ошибка выполнения beforeFunction'));
                var valid = _t.validate(obj);
                if (typeof valid == 'object') {
                    return cb(new UserError('invalid', {msg: valid.message, fields: valid.fields}));
                }
                return cb(null);
            });
        },
        function (cb) {
            // Проставим значения по умолчанию для virtual полей
            _t.loadDefaultValues(obj, function (err, result_obj) {
                obj = result_obj;
                return cb(err);
            });
        },
        function (cb) {
            if (obj.checkUnique === false) return cb(null);
            _t.checkUnique(obj, cb);
        },
        pool.getConn,
        function (conn, cb) {
            obj.created = funcs.getDateTimeMySQL();
            if (_t.auto_publish && !obj.published) {
                obj.published = funcs.getDateTimeMySQL();
            }

            conn.insert(_t.tableName, obj, function (err, recordId) {
                conn.release();
                if (err) {
                    console.log(err);
                    return cb(err);
                }
                if (rollback_key) {
                    var o = {
                        type: 'add',
                        params: {
                            object: _t.name,
                            id: recordId,
                            user:_t.user
                        }
                    };
                    rollback.add(rollback_key, o, function (err, res) {
                        if (err) return cb(err);
                        cb(null, recordId);
                    })
                } else {
                    cb(null, recordId);
                }
            });
        }
    ], function (err, recordId) {
        if (err) {
            if (err instanceof UserError) return cb(err);
            return cb(new MyError('Не удалось добавить запись.', err));
        }
        _t.clearCache();
        return cb(null, new UserOk(_t.table_ru + ' успешно добавлен' + _t.ending + '.', {id: recordId}));
    });
};

MySQLModel.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var user = _t.user;
    var fromClient = !(obj.fromClient === false);
    delete obj.fromClient;
    var rollback_key, rollback_index;
    if (obj.rollback_key) {
        rollback_key = obj.rollback_key;
        delete obj.rollback_key;
    }

    if (!obj.id) return cb(new MyError('Не передано ключевое поле. id',{object:_t.name,command:'modify',obj:obj}));
    async.waterfall([
        function (cb) {
            // Предзапрос ID из справочников по виртуальным полям
            async.eachSeries(Object.keys(obj), function (key, cb) {
                var colProfile = _t.class_fields_profile[key];
                if (typeof colProfile !== 'object') {
                    console.log('Не удалось получить профайл колонки...', key);
                    delete obj[key];
                    return cb(null);
                } // Просто игнорируем поля для которых нет профайла
                var colValue = obj[key];
                if (typeof obj[colProfile.keyword] === 'undefined' && typeof colValue !== 'undefined' && colProfile.virtual && colProfile.from_table && colProfile.keyword && colProfile.return_column) {
                    // Загрузим значение для статуса colValue
                    var o = {
                        command: 'get',
                        object: colProfile.from_table,
                        params: {
                            collapseData: false,
                            columns: ['id'],
                            where: [
                                {
                                    key: colProfile.return_column,
                                    val1: colValue
                                }
                            ]
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) {
                            console.log('Не удалось загрузить значение из справочнка', o, err);
                            delete obj[key];
                            return cb(null);
                        }
                        if (!res.length) {
                            console.log('В системе нет такого значения в связанной таблице', o);
                            return cb(null);
                        }
                        obj[colProfile.keyword] = res[0].id;
                        cb(null);
                    })
                } else cb(null);
            }, cb);
        },
        function (cb) {
            // Удалим не модифицируемые поля
            for (var i in obj) {
                var colProfile = _t.class_fields_profile[i];
                if (typeof colProfile !== 'object') {
                    console.log('Не удалось получить профайл колонки...', i);
                    delete obj[i];
                    continue;
                } // Просто игнорируем поля для которых нет профайла
                var colValue = obj[i];
                if ((colProfile.virtual && !colProfile.from_table) || (!colProfile.server_editable && !colProfile.server_updatable && fromClient && colProfile.column_name !== 'id')) delete obj[i];
            }
            delete obj['created'];
            if (Object.keys(obj).length < 2) return cb(new UserError('Поля, которые вы пытаетесь изменить не редактируемы.'));
            var requredNotFound = [];
            for (var j in _t.required_fields) {
                var colName = _t.required_fields[j];
                var colProfile2 = _t.class_fields_profile[colName];
                if (colProfile2.virtual) continue; // Я игнорирую requred для виртуальных полей
                if (typeof obj[colName] === '') requredNotFound.push({column_name: colName, name: colProfile2.name});
            }
            if (requredNotFound.length) {
                return cb(new UserError('requiredErr', {data: requredNotFound}));
            }
            obj = _t.setFormatingFunc(obj);
            _t.beforeFunction['modify'](obj, function (err) {
                if (err) return cb(new MyError('Ошибка выполнения beforeFunction'));
                var valid = _t.validate(obj);
                if (typeof valid == 'object') {
                    return cb(new UserError('invalid', {msg: valid.message, fields: valid.fields}));
                }
                return cb(null);
            });
        },

        function (cb) {
            if (obj.checkUnique === false) return cb(null);
            _t.checkUnique(obj, function (err) {
                if (err) return cb(err);
                return cb(null);
            });

        },
        function (cb) {
            if (!rollback_key) return cb(null);
            var o = {
                type: 'modify',
                params: {
                    object: _t.name,
                    id: obj.id,
                    user:_t.user
                },
                obj: obj
            };
            rollback.add(rollback_key, o, function (err, index) {
                if (err) return cb(err);
                rollback_index = index;
                return cb(null);
            })
        },
        pool.getConn,
        function (conn, cb) {
            obj.updated = funcs.getDateTimeMySQL();
            conn.update(_t.tableName, obj, function (err, affected) {
                conn.release();
                if (err) {
                    console.log(err);
                }
                return cb(err, affected);
            })
        }
    ], function (err, results) {
        if (err) {
            if (err instanceof UserError) return cb(err);
            rollback.remove(rollback_key, rollback_index);
            return cb(new MyError('Не удалось изменить ' + _t.table_ru, {id: obj.id, err: err}));
        }
        if (results == 0) {
            return cb(new UserError('notModified', {id: obj.id}));
        }
        _t.clearCache();
        return cb(null, new UserOk(_t.table_ru + ' успешно изменен' + _t.ending + '.', {id: obj.id}));
    });
};

MySQLModel.prototype.remove = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var user = _t.user;
    //if (fromClient){
    //    var confirm = obj.confirm;
    //    delete obj.confirm;
    //    if (!confirm) return cb(new UserError('needConfirm', {message: 'Эта операция требует подтверждения. Вы уверены, что хотите это сделать?'}));
    //}

    var rollback_key;
    if (obj.rollback_key) {
        rollback_key = obj.rollback_key;
        delete obj.rollback_key;
    }
    var id = obj.id;
    if (!obj.id) return cb(new MyError('Не передано ключевое поле. id'));

    var removeModel = function (conn, cb) {

        if (obj.physical) {
            conn.delete(_t.name, {id: id}, function (err, affected) {
                conn.release();
                if (err) {
                    console.log(err);
                }
                cb(err, affected);
            })
        } else {
            var o = {
                id: id,
                deleted: funcs.getDateTimeMySQL()
            };
            _t.modify(o, cb);
        }
    };
    async.waterfall([
        function (cb) {
            _t.beforeFunction['remove'](obj, function (err) {
                if (err) {
                    return cb(new MyError('Ошибка выполнения beforeFunction'));
                }
                return cb(null);
            });
        },
        pool.getConn,
        function (conn, cb) {
            if (obj.physical) {
                conn.delete(_t.tableName, {id: id}, function (err, affected) {
                    conn.release();
                    cb(err, affected);
                })
            } else {
                var o = {
                    id: id,
                    deleted: funcs.getDateTimeMySQL()
                };
                _t.modify(o, cb);
            }
        }
    ], function (err, results) {
        if (err) return cb(new MyError('Не удалось удалить запись.', err));
        if (results == 0) return cb(new UserError('rowNotFound'));
        _t.clearCache();
        if (rollback_key) {
            var o = {
                type: 'remove',
                params: {
                    object: _t.name,
                    id: id,
                    user:_t.user
                }
            };
            rollback.add(rollback_key, o, function (err, res) {
                if (err) return cb(err);
                return cb(null, new UserOk(_t.table_ru + ' успешно удален' + _t.ending + '.', {id: obj.id}));
            })
        } else {
            return cb(null, new UserOk(_t.table_ru + ' успешно удален' + _t.ending + '.', {id: obj.id}));
        }
    });
};

MySQLModel.prototype.getForSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var user = _t.user;
    var search_keyword = obj.search_keyword || '';
    var column_name = obj.column_name;
    if (!column_name) return cb(new MyError('Не передан параметр column_name'));
    var page_no = obj.page_no || 1;
    //select_search_columns
    var colProfile = _t.class_fields_profile[column_name];
    if (!colProfile) return cb(new MyError('Нет профайла для данного столбца'));
    var select_class = colProfile.select_class;// || _t.name;
    var select_search_columns = colProfile.select_search_columns || 'name';
    if (typeof select_search_columns == 'string') select_search_columns = select_search_columns.replace(/\s+/ig, '').split(',');
    var return_id = colProfile.return_id || 'id';
    var return_name = colProfile.return_name || select_search_columns[0] || 'name';

    var params = {
        page_no: page_no,
        limit: obj.limit || 40,
        columns: [return_id, return_name],
        where: []
    };
    for (var i in select_search_columns) {
        params.where.push({
            key: select_search_columns[i],
            type: 'like',
            val1: search_keyword,
            comparisonType: 'OR'
        })
    }
    if (!select_class) { // Если не указан класс у колонки в который стучаться
        //_t.get(params, cb);
        var res = funcs.collapseData([{id: 0, name: 'Необходимо указать поле select_class'}], {count: 1, count_all: 1});
        cb(null, res);
    } else { // есть класс, запросим его get
        var o = {
            command: 'get',
            object: select_class,
            params: params
        };
        _t.api(o, cb);
    }

    //select_search_columns

};

MySQLModel.prototype.getForFilterSelect = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var user = _t.user;
    var search_keyword = obj.search_keyword || '';
    var column_name = obj.column_name;
    var client_object = obj.client_object;
    if (!column_name) return cb(new MyError('Не передан параметр column_name'));
    var page_no = obj.page_no || 1;
    //select_search_columns
    //var colProfile = _t.class_fields_profile[column_name];
    //if (!colProfile) return cb(new MyError('Нет профайла для данного столбца'));
    //var select_class = colProfile.select_class;// || _t.name;
    //var select_search_columns = colProfile.select_search_columns || 'name';
    //if (typeof select_search_columns=='string') select_search_columns = select_search_columns.replace(/\s+/ig,'').split(',');
    //var return_id = colProfile.return_id || 'id';
    //var return_name = colProfile.return_name || 'name';

    // select id, distinct column_name from class where column_name like '%%'
    var params = {
        page_no: page_no,
        limit: obj.limit || 40,
        columns: [column_name],
        where: [],
        distinct: column_name
    };
    if (client_object) params.client_object = client_object;
    params.where.push({
        key: column_name,
        type: 'like',
        val1: search_keyword,
        comparisonType: 'OR'
    });

    var o = {
        command: 'get',
        object: _t.name,
        params: params
    };
    _t.api(o, cb);
};

MySQLModel.prototype.validate = function (obj) {
    var _t = this;
    var not_valid = [];
    for (var field in _t.validation) {
        if (_t.columns.indexOf(field) == -1) {
            continue;
        }
        var valFunc = _t.validation[field];
        if (obj[field] === undefined || typeof funcs.validation[valFunc] != 'function') {
            continue;
        }
        if (!funcs.validation[valFunc](obj[field])) {
            not_valid.push({
                field: field,
                format: _t.validationFormats[valFunc] || ''
            });
        }
    }
    if (not_valid.length > 0) {
        var o = {
            message: 'Одно или несколько полей имеет не верный формат',
            fields: not_valid
        };
        return o;
    } else {
        return true;
    }
};

MySQLModel.prototype.clearCache = function (cb) {
    var _t = this;

    _t.uniqueColumns = [];

    global.classesCache[_t.name] = {};
    console.log('=============>clearCache', _t.name);
    _t.table.getLinkedTables({}, function (err, res) {
        if (!err){
            for (var i in res) {
                var name =   res[i].charAt(0).toUpperCase() + res[i].substr(1);
                global.classesCache[name] = {};
                console.log('====>clearCacheAdditionalTables', name);
            }
        }else{
            console.log('Во время запроса связаных таблиц для очистки кеша возникла ош.', err);
        }
        if (typeof cb === 'function') cb(null);
    });
};

module.exports = MySQLModel;