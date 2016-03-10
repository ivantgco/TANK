var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var getCode = require('../libs/getCode');
var async = require('async');
var fs = require('fs');
var funcs = require('./functions');
var moment = require('moment');
var debug = true;

module.exports = function (obj, cb, user) {
    if (typeof cb !== 'function') throw new MyError('В API не передана функция callback');
    if (typeof obj !== 'object') return cb(new MyError('В API не передан obj'));
    obj = funcs.cloneObj(obj);
    obj.params = obj.params || {};
    var _t = this;
    if (!user) throw new MyError('В API не передан user');
    var command, object;
    var object_params = obj.object_params || {};
    var params = obj.params || {};
    var client_object = obj.client_object || params.client_object;
    //if (client_object) params.client_object = client_object;
    if (debug) var t1 = moment();
    if (obj.command == '_CLEAR') {
        global.classes = {};
        return cb(null, new UserOk('Кеш сброшен.'));
    }
    async.waterfall(
        [
            function (cb) {
                // Проверим аргументы
                command = obj.command;
                if (!command) return cb(new MyError('В запросе не указан комманда'));
                object = obj.object;
                if (!object) return cb(new MyError('В запросе не указан объект(класс)'));
                var dot_object = object.replace(/\.\w+/ig,'');
                var dot_client_object = object.replace(/\w+\.*/,'');
                if (dot_client_object) {
                    object = dot_object;
                    client_object = dot_client_object;
                }
                object = object.toLowerCase();
                object = object.charAt(0).toUpperCase() + object.substr(1);
                cb(null);
            },
            function (cb) {
                //checkAccess
                var doNotCheckCommands = {
                    Any:['_getClass','insertPayment'],
                    User:['login']
                };
                // Требует ли команда проверки доступа
                if (doNotCheckCommands.Any.indexOf(command)!==-1) return cb(null);
                if (typeof doNotCheckCommands[object]==='object'){
                    if (doNotCheckCommands[object].indexOf(command)!==-1) return cb(null);
                }
                // Если требуется -> проверим.
                if (!user.authorized) return cb(new UserError('noAuth'));
                //if ()
                //async.series([
                //    function (cb) {
                //
                //    }
                //],cb);

                cb(null);
            },
            function (cb) {
                // Подготовим alias
                var user_alias = '0';
                if (typeof user=='object'){
                    user_alias = user.sid;
                }
                var alias = object + '_-_' + user_alias;
                var alias_client_object = client_object || 0;
                //if (client_object) alias += '_' + client_object;
                for (var i in object_params) {
                    alias += "&" + i + ":" + object_params[i];
                }
                global.classes[alias] = global.classes[alias] || {};
                var _сlass = global.classes[alias][alias_client_object];
                if (_сlass) return cb(null, _сlass);
                // Если еще не создан, то создадим.
                var path = './classes/' + object + '.js';
                fs.access(path, function (err) {
                    if (err) return cb(new MyError('Такого объекта(класса) не существует.', object));
                    var _Сlass = require('.' + path);
                    object_params.alias = alias;
                    var classInstance = new _Сlass({
                        name:object,
                        client_object:client_object,
                        params:params,
                        user:user
                    });
                    if (typeof classInstance.init !=='function') return cb(new MyError('Нет метода init у класса '+ object));
                    classInstance.init(function (err) {
                        if (err) return cb(new MyError('При инициализации класса произошла ошибка.', err));
                        classInstance.alias = alias;
                        classInstance.alias_client_object = alias_client_object;
                        if (alias!=='Table') {
                            if (typeof global.classes[alias]!=='object') global.classes[alias] = {};
                            global.classes[alias][alias_client_object] = classInstance;
                        }
                        cb(null, classInstance);
                    });
                });
            },
            function (_сlass, cb) {
                // Выполнить действие или вернуть класс
                if (command=='_getClass') return cb(null, _сlass);
                if (command=='_clearCache') {
                    for (var key in global.classes) {
                        if (key.indexOf(object)===0){
                            global.classesCache[object] = {};
                            if (client_object) delete global.classes[key][client_object];
                            else global.classes[key] = {};
                        }
                    }
                    return cb(null, new UserOk('Кеш класса/клиентского объекта успешно очищен.'));
                }
                if (command=='_clearCacheAll') {
                    for (var key2 in global.classes) {
                        if (key2.indexOf(object)===0){
                            global.classesCache[object] = {};
                            global.classes[key2] = {};
                            delete global.classes[key2];
                        }
                    }
                    return cb(null, new UserOk('Кеш класса успешно очищен для всех клиентских объектов.'));
                }
                if (typeof _сlass !== 'object') return cb(new MyError('Класс не является объектом.'));
                if (typeof _сlass[command] !== 'function') return cb(new MyError('Класс не имеет такого метода.', {method: command}));
                _сlass[command](params, cb);
            }
        ], function (err, res) {
            // Проверить на ошибки
            if (debug) var request_time = moment().diff(t1);
            if (err) {
                if (err instanceof UserError) {
                    return cb(null, getCode(err.message, err.data), request_time);
                } else {
                    //console.log(err.stack);
                    return cb(err, getCode(err.code || 'sysError'), request_time);
                }
            } 
            // выполнить форматирование результата
            if (res instanceof UserOk) {
                return cb(null, getCode('ok', res), request_time);
            }
            cb(null, res, request_time);
        }
    );
};

