/**
 * Created by iig on 10.03.2016.
 */
var MyError = require('../../error').MyError;
var request = require('request');
var moment = require('moment');
var funcs = require('../../libs/functions');


var Widget = function (params) {
    if (typeof params!=='object') params = {};
    this.maxRequests = params.maxRequests || 20;
    this.host = params.host || 'https://shop.mirbileta.ru/cgi-bin/b2e';
    this.frame = params.frame || 'sdfsd9f8uorj83421o901hndhfs78df5t61yu4g1dck3h1239186yhoi';
    this.counters = {
        requests:0,
        loaded: 0,
        order_created: 0,
        queries:{}
    };
    this.queries_time = {

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
    var alias = obj.command + '.' + obj.object || '';
    var query = funcs.makeQuery(obj);
    request(_t.host + '?request=' + query, {}, function (err, res) {
        if (err) return cb(new MyError('Во время запроса произошел сбой', {query:query,err:err}));
        if (res.statusCode!==200){
            return cb(new MyError('Запрос вернулся с неверным кодом: ' + res.statusCode, {query:query}));
        }
        try {
            var data = JSON.parse(res.body);
            data = data.results[0];
            data = funcs.jsonToObj(data);
        } catch (e) {
            console.log(e);
            return cb(new MyError('Запрос вернул не корректный JSON',{query:query,res:res.body}));
        }
        console.log(data);
    });

};

Widget.prototype.start = function () {
    var _t = this;
    if (_t.stop) return;

};

module.exports = Widget;