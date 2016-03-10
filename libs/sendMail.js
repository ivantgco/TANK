var nodemailer = require('nodemailer');
var config = require('../config/index');
var send = function(obj, cb){
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    console.log(config.get('mail:mailTransport'));
    var transporter = nodemailer.createTransport(config.get('mail:mailTransport'));
    var mailOptions = {
        from: config.get('mail:from'),
        to: obj.email,
        subject: obj.subject || 'Тема письма', // Subject line
        text: obj.text || 'Текст письма', // plaintext body
        html: obj.html || 'Текст письма html'
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            cb(error, info);
        }else{
            cb(null, info);
        }
    });
};
module.exports = send;