/**
 * Created by iig on 10.03.2016.
 */
var MyError = require('../../error').MyError;
var request = require('request');
var moment = require('moment');
var async = require('async');
var funcs = require('../../libs/functions');


var Widget = function (params) {
    if (typeof params!=='object') params = {};
    this.maxRequests = params.maxRequests || 0;
    this.host = params.host;
    this.frame = params.frame;
    this.action = params.action;
    if (!this.host || !this.frame || !this.action) {
        console.log('action',this.action);
        console.log('host',this.host);
        console.log('frame',this.frame);
        throw new MyError('В Widget не переданы frame, host или action',{host:this.host, frame:this.frame, action_id:this.action});
    }
    this.action_id = params.action_id;
    this.wait_max_time = params.wait_max_time || 1;
    this.counters = {
        requests:0,
        errorRequests:0,
        loaded: 0,
        order_created: 0,
        queries:{},
        cycles:0
    };
    this.queries_time = {
        loading:[]
    }
};
Widget.prototype.request = function (obj, cb) {
    if (typeof cb!=='function') throw new MyError('В Widget request не передана cb');
    if (typeof obj!=='object') throw new MyError('В Widget request не переданы параметры');
    var _t = this;
    if (_t.stop) return;
    var t1 = moment();
    if (typeof obj.params!=='object') obj.params = {};
    obj.params.frame = obj.params.frame || _t.frame;
    var alias = obj.command + '.' + (obj.object || '');
    var query = funcs.makeQuery(obj);
    request(_t.host + '?request=' + query, {}, function (err, res) {
        _t.counters.requests++;
        if (typeof _t.counters.queries[alias]!=='object') _t.counters.queries[alias] = 0;
        _t.counters.queries[alias]++; // увеличим счетчик конкретного запроса
        if (typeof _t.queries_time[alias]!=='object') _t.queries_time[alias] = [];
        _t.queries_time[alias].push(moment()-t1);
        if (err) {
            _t.counters.errorRequests++;
            return cb(new MyError('Во время запроса произошел сбой', {query:query,err:err}));
        }
        if (res.statusCode!==200){
            _t.counters.errorRequests++;
            return cb(new MyError('Запрос вернулся с неверным кодом: ' + res.statusCode, {query:query}));
        }
        try {
            var data = JSON.parse(res.body);
            data = data.results[0];
        } catch (e) {
            console.log(e);
            return cb(new MyError('Запрос вернул не корректный JSON',{query:query,res:res.body}));
        }
        if (+data.code){
            console.log(data);
            return cb(new MyError('Логическая ошибка.',{query:query,data:data}));
        }
        return cb(null, data);

    });

};


/**
 * Рекурсивная функция.
 */
Widget.prototype.start = function () {
    var _t = this;
    if (_t.stop) return;
    // Вызвать загрузку виджета до мест на схеме
    // Если благоприятные условия -> создать заказ
    // Подождать
    // Повторить
    async.series([
        function (cb) {
            // Вызвать загрузку виджета до мест на схеме
            _t.loadScheme(function (err) {
                if (err){
                    _t.stop = err;
                }
                return cb(err);
            });
        },
        function (cb) {
            // Если благоприятные условия -> создать заказ
            return cb(null);
        },
        function (cb) {
            // Подождать
            var random_time = Math.round(Math.random(_t.wait_max_time));
            setTimeout(function () {
                cb(null);
            },random_time);
        }
    ], function (err) {
        // Повторить
        _t.counters.cycles++;
        if (err){
            if (!_t.stop) _t.stop = err;
            return;
        }
        //console.log('Выполнено раз:',_t.counters.cycles);
        if (_t.counters.cycles < _t.maxRequests || _t.maxRequests==0) return _t.start();
        //console.log('Счетчики:',_t.counters);
        //console.log('Время:',_t.queries_time);
        //console.log('Завершено.');
    })
};

Widget.prototype.loadScheme = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var t1 = moment();
    async.series([
        function (cb) {
            // Загрузим информацию по мероприятию <query><action_id>2983</action_id><frame>asdasd09bno245fmme</frame><command>get_actions</command></query>
            var o = {
                command: 'get_actions',
                params: {
                    action_id: _t.action.ACTION_ID
                }
            };
            _t.request(o, function (err, res) {
                if (err) return cb(err);
                var dataObj = funcs.jsonToObj(res);
                if (funcs.countObj(dataObj)==0) return cb(new MyError('Нет такого мероприятия'));
                _t.action = dataObj[0];
                cb(null);
            });
        },
        function (cb) {
            // Если мероприятие разбивается на сектора, то загрузим сектора, иначе сразу схему
            //SPLIT_BY_AREA_GROUP
            if (_t.action.SPLIT_BY_AREA_GROUP == 'TRUE'){
                async.series([
                    function (cb) {
                        // Загрузим сектора
                        //<query><action_id>1458</action_id><frame>kjhsdfsd87789sdfjs734j238dsj834g234i58skdu4y3278gyujwe7r3</frame><command>get_action_sectors</command></query>
                        //console.log('Загрузим сектора');
                        var o = {
                            command: 'get_action_sectors',
                            params: {
                                action_id: _t.action.ACTION_ID
                            }
                        };
                        _t.request(o, function (err, res) {
                            if (err) return cb(err);
                            var dataObj = funcs.jsonToObj(res);
                            if (funcs.countObj(dataObj)==0) return cb(new MyError('Нет секторов на мероприятие.'));
                            _t.action.sectors = dataObj;

                            // Загрузим слои и объекты для сектора
                            var o = {
                                command: 'get_action_scheme_layer',
                                params: {
                                    action_id: _t.action.ACTION_ID,
                                    VISIBLE: 'SECTOR'
                                }
                            };
                            _t.request(o, function (err, res) {
                                if (err) return cb(err);
                                var dataObj = funcs.jsonToObj(res);
                                if (funcs.countObj(dataObj)==0) {
                                    _t.action.layers = {};
                                    return cb(null);
                                }
                                _t.action.layers = dataObj;
                                async.eachSeries(_t.action.layers, function (item, cb) {
                                    var o = {
                                        command: 'get_action_scheme_object',
                                        params: {
                                            action_id: _t.action.ACTION_ID,
                                            VISIBLE: 'SECTOR'
                                        }
                                    };
                                    _t.request(o, function (err, res) {
                                        if (err) return cb(err);
                                        var dataObj = funcs.jsonToObj(res);
                                        if (funcs.countObj(dataObj)==0) {
                                            _t.action.objects = {};
                                            return cb(null);
                                        }
                                        _t.action.objects = dataObj;
                                        cb(null);
                                    });
                                }, cb);
                                cb(null);
                            });

                        });
                    },
                    function (cb) {
                        // загрузим случайный сектор где есть доступные места // FREE_PLACES
                        //console.log('загрузим случайный сектор где есть доступные места');
                        _t.activeSectors = [];
                        for (var i in _t.action.sectors) {
                            if (_t.action.sectors[i].FREE_PLACES > 0) _t.activeSectors.push(_t.action.sectors[i]);
                        }
                        var sectorsCount = _t.activeSectors.length;
                        if (!sectorsCount) return cb(new MyError('Нет мест на мероприятие.'));
                        var sector_num = Math.round(Math.random()*(sectorsCount-1));
                        //<query><action_id>1458</action_id><frame>kjhsdfsd87789sdfjs734j238dsj834g234i58skdu4y3278gyujwe7r3</frame><area_group_id>6171</area_group_id><command>get_action_scheme</command></query>
                        var o = {
                            command: 'get_action_scheme',
                            params: {
                                action_id: _t.action.ACTION_ID,
                                area_group_id: _t.activeSectors[sector_num].AREA_GROUP_ID
                            }
                        };
                        _t.request(o, function (err, res) {
                            if (err) return cb(err);
                            var dataObj = funcs.jsonToObj(res);
                            if (funcs.countObj(dataObj)==0) return cb(new MyError('Нет мест на мероприятие.'));
                            _t.action.squares = dataObj;
                            cb(null);
                        });
                    }
                ], cb);
            }else{
                // Просто загрузим схему <query><action_id>2983</action_id><frame>asdasd09bno245fmme</frame><command>get_action_scheme</command></query>
                //console.log('Просто загрузим схему');
                var o = {
                    command: 'get_action_scheme',
                    params: {
                        action_id: _t.action.ACTION_ID
                    }
                };
                _t.request(o, function (err, res) {
                    if (err) return cb(err);
                    var dataObj = funcs.jsonToObj(res);
                    if (funcs.countObj(dataObj)==0) return cb(new MyError('Нет мест на мероприятие.'));
                    _t.action.squares = dataObj;
                    cb(null);
                });
            }
        },
        function (cb) {
            // Загрузим слои и объекты
            //<query><action_id>2436</action_id><frame>kjhsdfsd87789sdfjs734j238dsj834g234i58skdu4y3278gyujwe7r3</frame><VISIBLE>IFRAME</VISIBLE><command>get_action_scheme_layer</command></query>
            //<query><action_id>2436</action_id><VISIBLE>IFRAME</VISIBLE><ACTION_SCHEME_LAYER_ID>1807</ACTION_SCHEME_LAYER_ID><command>get_action_scheme_object</command></query>
            //console.log('Загрузим слои и объекты. Последнее действие.');
            var o = {
                command: 'get_action_scheme_layer',
                params: {
                    action_id: _t.action.ACTION_ID,
                    VISIBLE: 'IFRAME'
                }
            };
            _t.request(o, function (err, res) {
                if (err) return cb(err);
                var dataObj = funcs.jsonToObj(res);
                if (funcs.countObj(dataObj)==0) {
                    _t.action.layers = {};
                    return cb(null);
                }
                _t.action.layers = dataObj;
                async.eachSeries(_t.action.layers, function (item, cb) {
                    var o = {
                        command: 'get_action_scheme_object',
                        params: {
                            ACTION_ID: _t.action.ACTION_ID,
                            ACTION_SCHEME_LAYER_ID: item.ACTION_SCHEME_LAYER_ID,
                            VISIBLE: 'IFRAME'
                        }
                    };
                    _t.request(o, function (err, res) {
                        if (err) return cb(err);
                        var dataObj = funcs.jsonToObj(res);
                        if (funcs.countObj(dataObj)==0) {
                            _t.action.objects = {};
                            return cb(null);
                        }
                        _t.action.objects = dataObj;
                        cb(null);
                    });
                }, cb);
            });
        }
    ], function (err) {
        if (err) return cb(err);
        _t.counters.loaded++;
        _t.queries_time.loading.push(moment()-t1);
        cb(null);
    });
};

module.exports = Widget;