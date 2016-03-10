/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var funcs = require('../libs/functions');
var api = require('../libs/api');
var async = require('async');
var mustache = require('mustache');
var fs = require('fs');
var sendMail = require('../libs/sendMail');
var Guid = require('guid');
var generateCalndar = require('../modules/generate_calendar');
var rollback = require('../modules/rollback');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();
    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.addPrototype = Model.prototype.add;
//Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removePrototype = Model.prototype.remove;

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(null);
    }]);
};
Model.prototype.addHistory = function (obj, cb) { // Создадим запись в истории мерчанта
    var _t = this;
    if (typeof cb!=='function') throw new MyError('В addHistory не передана функция cb');
    if (typeof obj!=='object') return cb(new MyError('В метод не передан obj', {method:'addHistory'}));
    var merchant_id = obj.merchant_id;
    if (!merchant_id) return cb(new MyError('В addHistory не передан merchant_id'));
    var o = {
        command: 'add',
        object: 'merchant_history_log.tbl_merchant_history_log',
        params: {
            merchant_id: merchant_id,
            datetime: funcs.getDateTimeMySQL()
        }
    };
    for (var i in obj) {
        o.params[i] = obj[i]
    }

    _t.api(o, function (err, res) {
        if (err) return cb(new MyError('Не удалось добавить запись в историю мерчанта.', {
            err: err,
            merchant_id: merchant_id,
            params: o.params
        }));
        cb(null);
    })
};
Model.prototype.setStatus = function (obj, cb) { // Создадим запись в истории мерчанта
    if (typeof cb!=='function') throw new MyError('В setStatus не передана функция cb');
    if (typeof obj!=='object') return cb(new MyError('В метод не передан obj', {method:'setStatus'}));
    var _t = this;
    var id = obj.id;
    var status = obj.status;
    if (isNaN(+id)) return cb(new MyError('В setStatus не передан id'));
    if (typeof status!=='string') return cb(new MyError('В setStatus не передан status'));
    var o = {
        id:id,
        merchant_status_sysname:status
    };
    _t.modify(o, cb);
};


Model.prototype.calc_functions = {
    card_turnover: function (obj) {
        var total_turnover = obj.total_turnover;
        var visa_mc_percent = obj.visa_mc_percent;
        if (isNaN(+total_turnover) || isNaN(+visa_mc_percent)){
            console.log('Не достаточно данных для вычисления.',{field:'card_turnover',total_turnover:total_turnover,visa_mc_percent:visa_mc_percent});
            return obj;
        }
        obj.card_turnover = total_turnover * (visa_mc_percent/100);
        return obj;
    },
    profit: function (obj) {
        var total_turnover = obj.total_turnover;
        var profitability = obj.profitability;
        if (isNaN(+total_turnover) || isNaN(+profitability)){
            console.log('Не достаточно данных для вычисления.',{field:'profit',total_turnover:total_turnover,profitability:profitability});
            return obj;
        }
        obj.profit = total_turnover * (profitability/100);
        return obj;
    },
    profit_card: function (obj) {
        var visa_mc_percent = obj.visa_mc_percent;
        var profit = obj.profit;
        if (isNaN(+profit) || isNaN(+visa_mc_percent)){
            console.log('Не достаточно данных для вычисления.',{field:'profit_card',visa_mc_percent:visa_mc_percent,profit:profit});
            return obj;
        }
        obj.profit_card = profit * (visa_mc_percent/100);
        return obj;
    },
    founding_amount: function (obj) {
        if (obj.dont_recalc_founding_amount && obj.founding_amount) return obj;
        var total_turnover = obj.total_turnover;
        var visa_mc_percent = obj.visa_mc_percent;
        if (isNaN(+total_turnover) || isNaN(+visa_mc_percent)){
            console.log('Не достаточно данных для вычисления.',{field:'founding_amount',total_turnover:total_turnover,visa_mc_percent:visa_mc_percent});
            return obj;
        }
        obj.founding_amount = total_turnover * (visa_mc_percent/100);
        return obj;
    },
    amount_to_return: function (obj) {
        var founding_amount = obj.founding_amount;
        var factoring_rate = obj.factoring_rate;
        if (isNaN(+founding_amount) || isNaN(+factoring_rate)){
            console.log('Не достаточно данных для вычисления.',{field:'amount_to_return',founding_amount:founding_amount,factoring_rate:factoring_rate});
            return obj;
        }
        obj.amount_to_return = founding_amount + (founding_amount * factoring_rate/100);
        return obj;
    },
    amount_card_day: function (obj) {
        var card_turnover = obj.card_turnover;
        var acquiring_days_count = obj.acquiring_days_count;
        if (isNaN(+card_turnover) || isNaN(+acquiring_days_count)){
            console.log('Не достаточно данных для вычисления.',{field:'amount_card_day',card_turnover:card_turnover,acquiring_days_count:acquiring_days_count});
            return obj;
        }
        if (acquiring_days_count === 0) {
            console.log('Не достаточно данных для вычисления. acquiring_days_count == 0');
            return obj;
        }
        obj.amount_card_day = card_turnover / acquiring_days_count;
        return obj;
    },
    payment_amount: function (obj) {
        var amount_card_day = obj.amount_card_day;
        var avl_proc_dly_withdraw_rate = obj.avl_proc_dly_withdraw_rate;
        if (isNaN(+amount_card_day) || isNaN(+avl_proc_dly_withdraw_rate)){
            console.log('Не достаточно данных для вычисления.',{field:'payment_amount',amount_card_day:amount_card_day,avl_proc_dly_withdraw_rate:avl_proc_dly_withdraw_rate});
            return obj;
        }
        obj.payment_amount = amount_card_day * avl_proc_dly_withdraw_rate/100;
        return obj;
    },
    payments_count: function (obj) {
        var payment_amount = obj.payment_amount;
        var amount_to_return = obj.amount_to_return;
        if (isNaN(+payment_amount) || isNaN(+amount_to_return)){
            console.log('Не достаточно данных для вычисления.',{field:'payments_count',payment_amount:payment_amount,amount_to_return:amount_to_return});
            return obj;
        }
        if (payment_amount === 0) {
            console.log('Не достаточно данных для вычисления. payment_amount == 0');
            return obj;
        }
        obj.payments_count = Math.ceil(amount_to_return / payment_amount);
        return obj;
    }
};

//Model.prototype.modify = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    var _t = this;
//    var rollback_key = rollback.create();
//    obj.rollback_key = (typeof obj.rollback_key!=='undefined')? obj.rollback_key : rollback_key;
//    _t.modifyPrototype(obj, function (err, res) {
//        delete obj.rollback_key;
//        if (err) return cb(err);
//        rollback.rollback(rollback_key, function (err, res) {
//            console.log('Результат выполнения rollback', err, res);
//        });
//        cb(err, res);
//    });
//};
Model.prototype.removeTESTROLLBACK = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = rollback.create();
    obj.rollback_key = (typeof obj.rollback_key!=='undefined')? obj.rollback_key : rollback_key;
    _t.removePrototype(obj, function (err, res) {
        delete obj.rollback_key;
        if (err) return cb(err);
        rollback.rollback(rollback_key, function (err, res) {
            console.log('Результат выполнения rollback', err, res);
        }, true);
        cb(err, res);
        });
};

///------------ADD---------------------//
Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'add_' + client_object;
    if (typeof _t[coFunction] === 'function'){
        _t[coFunction](obj, cb);
    }else{
        _t.addPrototype(obj, cb);
    }
};

Model.prototype.add_table_merchant_worksheet = function (obj, cb) {
    // Здесь необходимо
    // Получим данные из справочной таблицы тип бизнеса
    // Создадим запись addPrototype
    // Получим ID документов для этого бизнеса
    // Создадим соответствующие записи в документах мерчанта
    // Запишем лог о создании
    var _t = this;
    var rollback_key = rollback.create();
    var document_ids = [];
    var merchant_id;
    if (!obj.business_type_id) return cb(new UserError('Тип бизнеса обязателен к заполнению', {data:'Ожидается business_type_id'}));

    async.series({
        preloadFromBusinesType: function (cb) {
            // Получим данные из справочной таблицы тип бизнеса
            var o = {
                command: 'get',
                object: 'business_type',
                params: {
                    collapseData: false,
                    columns: ['profitability', 'visa_mc_percent', 'acquiring_days_count'],
                    where: [
                        {
                            key: 'id',
                            val1: obj.business_type_id
                        }
                    ]
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить данные для данного бизнеса.', {
                    err: err,
                    business_type_id: obj.business_type_id
                }));
                if (!res.length) return cb(null);
                for (var i in res[0]) {
                    obj[i] = (typeof obj[i] !== 'undefined') ? obj[i] : res[0][i];
                }
                cb(null);
            })
        },
        loadDefaults: function (cb) {
            _t.loadDefaultValues(obj, function (err, result_obj) {
                obj = result_obj;
                return cb(err);
            }, {standart:true});
        },
        calc: function (cb) {
            var cals_funcs = _t.calc_functions;
            for (var i in cals_funcs) {
                if (typeof cals_funcs[i]==='function') obj = cals_funcs[i](obj);
            }
            delete obj.card_turnover;
            delete obj.amount_card_day;
            cb(null);
        },
        add: function (cb) { // Создадим запись addPrototype
            obj.rollback_key = rollback_key;
            _t.addPrototype(obj, function (err, res) {
                delete obj.rollback_key;
                if (err) return cb(err);
                merchant_id = res.id;
                cb(err, res);
            });
        },
        getDocs: function (cb) { // Получим ID документов для этого бизнеса
            var o = {
                command: 'get',
                object: 'document_for_business_type',
                params: {
                    collapseData: false,
                    columns: ['document_id'],
                    where: [
                        {
                            key: 'business_type_id',
                            val1: obj.business_type_id
                        }
                    ]
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить документы для данного бизнеса.', {
                    err: err,
                    business_type_id: obj.business_type_id
                }));
                document_ids = res;
                cb(null);
            })
        },
        insertDocs: function (cb) { // Создадим соответствующие записи в документах мерчанта
            async.eachSeries(document_ids, function (item, cb) {
                var o = {
                    command: 'add',
                    object: 'merchant_document.tbl_merchant_document',
                    params: {
                        merchant_id: merchant_id,
                        document_id: item.document_id
                    }
                };
                o.params.rollback_key = rollback_key;
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось добавить документы для данного бизнеса.', {
                        err: err,
                        merchant_id: merchant_id,
                        business_type_id: obj.business_type_id
                    }));
                    cb(null);
                })
            }, cb);

        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            obj.merchant_id = merchant_id;
            _t.addHistory(obj, cb);
        }
    }, function (err, res) {
        if (err) {
            rollback.rollback(rollback_key, function (err, res) {
                console.log('Результат выполнения rollback', err, res);
            });
            return cb(err);
        }
        return cb(null, res.add);
    });
};

Model.prototype.add_ = Model.prototype.add_table_merchant_worksheet;

Model.prototype.add_form_merchant_worksheet = Model.prototype.add_table_merchant_worksheet;

///--------END-ADD---------------------//

/*

 */
Model.prototype.recalcWorksheet = function(obj, cb){
    // Загрузить значение из базы
    // Выполнить функции пересчета
    // сравнить, были ли изменения
    // если были, то сохранить и записать лог
    // если нет, вернуть уведомление
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var merchant;
    if (!id || isNaN(+id)) return cb(new MyError('В recalcWorksheet не передан id'));
    async.series({
        load: function (cb) {
            // Загрузить значение из базы
            var params = {
                where:[
                    {
                        key:'id',
                        val1:id
                    }
                ],
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Нет такой записи в merchant',{params:params}));
                merchant = res[0];
                return cb(null);
            })
        },
        recalc: function (cb) {
            // Выполнить функции пересчета
            var cals_funcs = _t.calc_functions;
            var toModify = [];
            for (var i in cals_funcs) {
                if (typeof cals_funcs[i]==='function') {
                    var old_val = merchant[i];
                    if (obj.dont_recalc_founding_amount) merchant.dont_recalc_founding_amount = obj.dont_recalc_founding_amount;
                    merchant = cals_funcs[i](merchant);
                    if (typeof old_val!=='undefined' && old_val!==merchant[i]){
                        toModify.push(i);
                    }
                }
            }
            if (!toModify.length) return cb(new UserError('Нет изменений для пересчета'));
            var params = {};
            for (var j in toModify) {
                params[toModify[j]] = merchant[toModify[j]];
            }
            params.id = id;
            async.series([
                function (cb) {
                    _t.modify(params, cb);
                },
                function (cb) {
                    // запишем лог
                    var o = {
                        merchant_id: id,
                        history_log_status_sysname: 'RECALC'
                    };
                    for (var i in merchant) {
                        if (typeof o[i] !== 'undefined') continue;
                        o[i] = merchant[i];
                    }
                    _t.addHistory(o, cb);
                }
            ], cb);

        }
    }, function (err, res) {
        if (err){
            if (err instanceof UserError) return cb(err);
            return cb(err);
        }
        cb(null, new UserOk('Пересчет успешно произведен'));
    })
};

Model.prototype.sendOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    // Получить данные о мерчанте
    // подготовить шаблон письма (в дальнейшем .doc)
    // Отравить на емайл
    // Поменять статус
    // Записать лог
    var tpl = '';
    var merchant;
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        prepareTemplate: function (cb) {
            fs.readFile('./templates/offer.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();

                var m_obj = {
                    founding_amount:merchant.founding_amount,
                    amount_to_return:merchant.amount_to_return,
                    payments_count:merchant.payments_count,
                    payment_amount:merchant.payment_amount,
                    factoring_rate:merchant.factoring_rate,
                    fio:merchant.fio
                };

                tpl = mustache.to_html(tpl, m_obj);

                cb(null);

            });

        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            sendMail({email:merchant.email, html:tpl}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err:err, info:info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'OFFER_SENDED'
            }, function (err) {
                if (err) return cb(new UserError('Предложение отправлено. Но не удалось изменить статус торговца. Обратитесь к администратору.', {err:err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'OFFER_SENDED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Предложение успешно отправлено'));

    });
};

Model.prototype.denyOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    if (!obj.merchant_worksheet_deny_reason_id) return cb(new UserError('Не указана причина отказа.'));
    if (!obj.comment) return cb(new UserError('Комментарий обязательно должен быть указан.'));

    // Получить данные о мерчанте
    // Поменять статус
    // Записать лог
    var merchant;
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (merchant.merchant_status_sysname!=='OFFER_SENDED') return cb(new UserError('Заявка должна быть отправлена торговцу.'));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'OFFER_DECLINED'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось отклонить заявку. Обратитесь к администратору.', {err:err}));
                cb(err);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'OFFER_DECLINED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }
            o.merchant_worksheet_deny_reason_id = obj.merchant_worksheet_deny_reason_id;
            o.comment = obj.comment;
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            // Поменять статус обратно
            _t.setStatus({
                id:id,
                status:merchant.merchant_status_sysname || 'OFFER_SENDED'
            }, function (err2) {
                if (err2) console.log(err2);
                return cb(err);
            });
        }else{
            cb(null, new UserOk('Предложение успешно отклонено'));
        }

    })
};

Model.prototype.acceptOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    // Получить данные о мерчанте
    // Поменять статус
    // Записать лог
    var merchant;
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (merchant.merchant_status_sysname!=='OFFER_SENDED') return cb(new UserError('Заявка должна быть отправлена торговцу.'));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'OFFER_ACCEPTED'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось принять заявку. Обратитесь к администратору.', {err:err}));
                cb(err);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'OFFER_ACCEPTED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            // Поменять статус обратно
            _t.setStatus({
                id:id,
                status:merchant.merchant_status_sysname || 'OFFER_SENDED'
            }, function (err2) {
                if (err2) console.log(err2);
                return cb(err);
            });
        }else{
            cb(null, new UserOk('Предложение успешно принято'));
        }

    })
};

Model.prototype.requestDocuments = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    // Получить данные о мерчанте
    // подготовить шаблон письма (в дальнейшем .doc)
    // Отравить на емайл
    // Поменять статус
    // Записать лог
    var tpl = '';
    var merchant;
    var docs;
    var docNames = [];
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        getDocs: function (cb) {
            var o = {
                command: 'get',
                object: 'Merchant_document',
                params: {
                    collapseData: false,
                    where: [
                        {
                            key: 'merchant_id',
                            val1: merchant.id
                        },
                        {
                            key: 'status_sysname',
                            val1: 'CREATED'
                        }
                    ]
                }
            };

            _t.api(o, function(err, res){

                if (err) return cb(new MyError('Не удалось получить документы торговца.', {
                    err: err,
                    merchant_id: merchant.id,
                    params: o.params
                }));
                docs = res;
                cb(null);
            });
        },
        prepareTemplate: function (cb) {
            fs.readFile('./templates/request_docs.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();

                var m_obj = {
                    founding_amount:merchant.founding_amount,
                    amount_to_return:merchant.amount_to_return,
                    payments_count:merchant.payments_count,
                    payment_amount:merchant.payment_amount,
                    factoring_rate:merchant.factoring_rate,
                    fio:merchant.fio,
                    docs: []
                };

                for(var i in docs){
                    m_obj.docs.push({
                        title: docs[i].document_name
                    });
                    docNames.push(docs[i].document_name);
                }

                tpl = mustache.to_html(tpl, m_obj);

                cb(null);

            });

        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            sendMail({email:merchant.email, html:tpl}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err:err, info:info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'DOCS_REQUESTED'
            }, function (err) {
                if (err) return cb(new UserError('Предложение отправлено. Но не удалось изменить статус торговца. Обратитесь к администратору.', {err:err}));
                cb(null);
            });
        },
        updateDocsStatuses: function (cb) {
            // Проставить документам статусы
            async.eachSeries(docs, function(item, cb){
                var o = {
                    command: 'modify',
                    object: 'Merchant_document',
                    params: {
                        id: item.id,
                        status_sysname: 'REQUESTED'
                    }
                };

                _t.api(o, cb);

            }, cb);
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'DOCS_REQUESTED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            o.comment = docNames.join(', ');

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Предложение успешно отправлено'));

    });
};

//unfinished
Model.prototype.prepareAgreement = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    // Получить данные о мерчанте
    // подготовить шаблон письма (в дальнейшем .doc)
    // Отравить на емайл
    // Поменять статус
    // Записать лог
    var tpl = '';
    var merchant;
    var docs;
    var docNames = [];
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        getDocs: function (cb) {
            var o = {
                command: 'get',
                object: 'Merchant_document',
                params: {
                    collapseData: false,
                    where: [
                        {
                            key: 'merchant_id',
                            val1: merchant.id
                        },
                        {
                            key: 'status_sysname',
                            val1: 'CREATED'
                        }
                    ]
                }
            };

            _t.api(o, function(err, res){

                if (err) return cb(new MyError('Не удалось получить документы торговца.', {
                    err: err,
                    merchant_id: merchant.id,
                    params: o.params
                }));
                docs = res;
                cb(null);
            });
        },
        prepareTemplate: function (cb) {
            fs.readFile('./templates/main_agreement.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();

                var m_obj = {
                    founding_amount:merchant.founding_amount,
                    amount_to_return:merchant.amount_to_return,
                    payments_count:merchant.payments_count,
                    payment_amount:merchant.payment_amount,
                    factoring_rate:merchant.factoring_rate,
                    fio:merchant.fio,
                    name:merchant.name,
                    docs: []
                };

                for(var i in docs){
                    m_obj.docs.push({
                        title: docs[i].document_name
                    });
                    docNames.push(docs[i].document_name);
                }

                tpl = mustache.to_html(tpl, m_obj);

                cb(null);

            });

        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            sendMail({email:merchant.email, html:tpl}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err:err, info:info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'AGREEMENT_SENT'
            }, function (err) {
                if (err) return cb(new UserError('Договор отправлен. Но не удалось изменить статус торговца. Обратитесь к администратору.', {err:err}));
                cb(null);
            });
        },
        //updateDocsStatuses: function (cb) {
        //    // Проставить документам статусы
        //    async.eachSeries(docs, function(item, cb){
        //        var o = {
        //            command: 'modify',
        //            object: 'Merchant_document',
        //            params: {
        //                id: item.id,
        //                status_sysname: 'REQUESTED'
        //            }
        //        };
        //
        //        api(o, cb);
        //
        //    }, cb);
        //},
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'AGREEMENT_SENT'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Договор успешно отправлен'));

    });
};

//unfinished
Model.prototype.uploadMainAgreement = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    if (!obj.filename) return cb(new MyError('Не передан filename'));
    var tpl = '';
    var merchant;
    var docs;
    var docNames = [];
    var file_id;
    var rollback_key = rollback.create();
    async.series({
        copyFile: function (cb) {
            // Добавим файл в систему File.add, получим id файла.
            var o = {
                command: 'add',
                object: 'File',
                params: {
                    filename: obj.filename,
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                file_id = res.id;
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        getDocs: function (cb) {
            var o = {
                command: 'get',
                object: 'Merchant_document',
                params: {
                    collapseData: false,
                    where: [
                        {
                            key: 'merchant_id',
                            val1: merchant.id
                        },
                        {
                            key: 'status_sysname',
                            val1: 'CREATED'
                        }
                    ]
                }
            };

            _t.api(o, function(err, res){

                if (err) return cb(new MyError('Не удалось получить документы торговца.', {
                    err: err,
                    merchant_id: merchant.id,
                    params: o.params
                }));
                docs = res;
                cb(null);
            });
        },
        modifyMerchant : function (cb) {
            // Запишем мерчанту загруженный файл договора
            _t.modify({
                id:id,
                rollback_key:rollback_key,
                main_agreement_file_id:file_id
            }, cb);
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'AGREEMENT_UPLOADED'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус торговца. Обратитесь к администратору.', {err:err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'AGREEMENT_UPLOADED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Договор успешно загружен в систему'));

    });
};
//unfinished
Model.prototype.transferToWork = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var start_date = obj.start_date;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    var tpl = '';
    var merchant;
    var docs;
    var bank;
    var calendar;
    var calendar_id;
    var docNames = [];
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id:id,
                status:'READY_TO_WORK'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус торговца. Обратитесь к администратору.', {err:err}));
                cb(null);
            });
        },
        changeState: function (cb) {
            // Поменять состояние

            _t.modify({
                id: id,
                merchant_state_sysname: 'MERCHANT'
            }, function (err, res) {
                if(err) return cb(new MyError('Не удалось изменить состояние торговца'));
                cb(null);
            });

        },
        getBank: function (cb) {
            var o = {
                command: 'get',
                object: 'Bank',
                params: {
                    collapseData: false,
                    where: [
                        {
                            key: 'is_default',
                            val1: true
                        }
                    ]
                }
            };

            _t.api(o, function (err, res) {
                if(err) return cb(err);
                if(!res.length) return cb(new MyError('Не удалось получить Банк', err));
                bank = res[0];
                cb(null);
            });
        },
        createBankMerchantPair: function(cb){
            var o = {
                command: 'add',
                object: 'Bank_merchant',
                params: {
                    merchant_id: id,
                    bank_id: bank.id,
                    secret: Guid.create().value
                }
            };

            _t.api(o, function (err, res) {
                if(err) return cb(err);
                cb(null);
            });
        },
        generateCalendar: function (cb) {
            generateCalndar({
                date_start: start_date,
                payments_count: merchant.payments_count
            }, function (err, res) {
                calendar = res;
                cb(null);
            });
        },
        createCalendar: function (cb) {
            var o = {
                command: 'add',
                object: 'Merchant_calendar',
                params: {
                    merchant_id: id,
                    bank_id: bank.id,
                    status_sysname: 'CREATED'
                }
            };

            _t.api(o, function (err, res) {
                if(err) return cb(err);
                calendar_id = res.id;
                cb(null);
            });
        },
        createPayments: function (cb) {

            var lastpayment = merchant.amount_to_return -  merchant.payment_amount * (merchant.payments_count - 1 );

            var counter = 0;

            async.eachSeries(calendar, function (item , cb) {

                var o = {
                    command: 'add',
                    object: 'merchant_payment',
                    params: {
                        merchant_id: id,
                        calendar_id: calendar_id,
                        bank_id: bank.id,
                        status_sysname: 'PENDING',
                        payment_date: item
                    }
                };

                if(counter == calendar.length -1 ){
                    o.params.pending_amount = lastpayment;
                }else{
                    o.params.pending_amount = merchant.payment_amount;
                }

                _t.api(o, function (err, res) {
                    if(err) return cb(err);
                    counter ++;
                    cb(null);
                });
            }, function (err, res) {
                if(err) return cb(err);
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'READY_TO_WORK'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Договор успешно загружен в систему'));

    });
};
//unfinished
Model.prototype.makePayment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    var tpl = '';
    var merchant;
    var docs;
    var docNames = [];
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        setPaymentSend: function(cb){

            _t.modify({
                money_sent: true,
                id: id
            }, cb);

        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'MONEY_SENDED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Статус изменен'));

    });
};
//unfinished
Model.prototype.notifyBank = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    var tpl = '';
    var merchant;
    var docs;
    var docNames = [];
    async.series({
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        setBankNotified: function(cb){

            _t.modify({
                bank_notified: true,
                id: id
            }, cb);

        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'BANK_NOTIFIED'
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Банк уведомлен'));

    });
};


module.exports = Model;