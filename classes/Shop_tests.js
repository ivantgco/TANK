/**
 * Created by iig on 10.03.2016.
 */
var MyError = require('../error').MyError;
var Widget = require('./shop_tests/Widget');
var request = require('request');
var moment = require('moment');
var async = require('async');
var funcs = require('../libs/functions');


var Model = function(obj){
    this.name = obj.name;
    this.host = obj.host || 'https://shop.mirbileta.ru/cgi-bin/b2e';
    this.widgetes = [];
    this.widgetesCount = 0;
    this.max_widgetes_count = 0;
    this.actions_list = [];
    this.actions = [];
};

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    cb(null);

};
Model.prototype.request = function (obj, cb) {
    var _t = this;
    obj.params.frame = obj.params.frame || _t.frame;
    var query = funcs.makeQuery(obj);
    request(_t.host + '?request=' + query, {}, function (err, res) {
        if (err) {
            return cb(new MyError('Во время запроса произошел сбой', {query:query,err:err}));
        }
        if (res.statusCode!==200){
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
Model.prototype.start = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    _t.host = obj.host || _t.host;
    _t.frame = obj.frame;
    if (!_t.frame) return cb(new MyError('Необходимо передавать фрейм'));
    _t.max_widgetes_count = obj.max_widgetes_count || _t.max_widgetes_count || 0;

    _t.actions_list = (Array.isArray(obj.actions_list))? obj.actions_list : _t.actions_list || [];
    // надо загрузить
    var o = {
        command:'get_actions',
        params:{
            action_id:_t.actions_list.split
        }
    };
    _t.request(o, function (err, res) {
        if (err) return cb(err);
        var objData = funcs.jsonToObj(res);
        for (var i in objData) {
            _t.actions.push(objData[i]);
        }
        _t.timeStart = moment();
        _t.sync();
    });
    //_t.sync(obj);
};
Model.prototype.sync = function (obj) {
    obj = obj || {};
    var _t = this;
    _t.max_widgetes_count = obj.max_widgetes_count || _t.max_widgetes_count || 0;

    // Соберем статистическую информацию
    // Запускаем необходимое количество процессов
    //-------------------------------------------
    // посчитаем текущее количество виджетов
    _t.widgetesCount = 0;
    var requestsCount = 0;

    var errorRequests = 0;
    var loaded = 0;
    for (var i in _t.widgetes) {
        if (!_t.widgetes[i].stop) _t.widgetesCount++;
        requestsCount += _t.widgetes[i].counters.requests;
        errorRequests += _t.widgetes[i].counters.errorRequests;
        loaded += _t.widgetes[i].counters.loaded;
    }
    var timeCycle = moment();
    console.log('Запущено виджетов', _t.widgetesCount);
    console.log('Загружено виджетов (раз):', loaded);
    console.log('Выполнено запросов:', requestsCount);
    console.log('С ош.:', errorRequests);
    var timeAgo = (timeCycle - _t.timeStart)/1000;
    console.log('Запросов в секунду СРЕДНЕЕ:', requestsCount / timeAgo);
    var requestsCountMoment = requestsCount - (_t.requestsCountOld || 0);
    _t.requestsCountOld = requestsCount;
    console.log('Запросов в секунду МОМЕНТАЛЬНОЕ:', requestsCountMoment);
    console.log('Виджетов в секунду ===СРЕДНЕЕ======>', loaded / timeAgo);
    console.log('_____________ '+ timeCycle.format('HH:mm:ss') +'_______Прошло: '+ timeAgo +' сек._______________\n');
    var needToStart = _t.max_widgetes_count - _t.widgetesCount;
    var widgetesTmp = [];
    for (var c=0; c<needToStart; c++){
        var action = _t.actions[Math.round((Math.random() * _t.actions.length - 1))];
        if (!action) continue;
        var o = {
            host: _t.host,
            frame: _t.frame,
            action: action
        };
        var w1 = new Widget(o);
        widgetesTmp.push(w1);
    }
    async.each(widgetesTmp, function (item, cb) {
         setTimeout(function () {
             _t.widgetes.push(item);
             item.start();
             cb(null);
         }, Math.round(Math.random()*1000 * widgetesTmp.length));
    }, function (err) {
        if (err) throw err;
        setTimeout(function () {
            _t.sync();
        },1000)
    });
};
Model.prototype.one = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    //
    //var w1 = new Widget({action_id:2978});
    var w1 = new Widget({action_id:1237});
    w1.start();
    //w1.request({
    //    command:'get_action_sectors',
    //    object:'',
    //    params:{
    //        action_id:'1237'
    //    }
    //}, function (err, res) {
    //    console.log('ERR', err);
    //})
};
module.exports = Model;