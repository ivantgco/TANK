/**
 * Created by iig on 28.11.2015.
 */
/**
 * Created by iig on 04.11.2015.
 */
var MyError = require('../../error').MyError;
var MySQLModel = require('../../models/system/MySQLModel');
var util = require('util');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var api = require('../../libs/api');

var BasicClass = function (obj) {

    var mysqlmodel = MySQLModel.call(this, obj);
    if (mysqlmodel instanceof MyError) return mysqlmodel;
};
util.inherits(BasicClass, MySQLModel);

BasicClass.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    BasicClass.super_.prototype.init.apply(this, [obj, function (err) {
        // Выполним инициализацию BasicClass
        cb(err);
    }]);
};

BasicClass.prototype.test = function () {
    setInterval(console.log('BasicClass.prototype.test'),80);
};
module.exports = BasicClass;