/**
 * Created by iig on 10.03.2016.
 */
var MyError = require('../error').MyError;
var Widget = require('./shop_tests/Widget');

var Model = function(obj){
    this.name = obj.name;
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
Model.prototype.one = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var w1 = new Widget({});
    w1.request({
        command:'get_action_sectors',
        object:'',
        params:{
            action_id:'1237'
        }
    }, function (err, res) {
        console.log('ERR', err);
    })
};
module.exports = Model;