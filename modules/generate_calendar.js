
var moment = require('moment');
var MyError = require('../error').MyError;
var request = require('request');
//var async = require('async');

var reservData = {"data":{"2003":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":0},"5":{"isWorking":3},"6":{"isWorking":2},"7":{"isWorking":2}},"2":{"24":{"isWorking":2}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2},"21":{"isWorking":0}},"11":{"6":{"isWorking":3},"7":{"isWorking":2}},"12":{"11":{"isWorking":3},"12":{"isWorking":2},"31":{"isWorking":3}}},"2004":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"6":{"isWorking":3},"7":{"isWorking":2}},"2":{"23":{"isWorking":2}},"3":{"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"3":{"isWorking":2},"4":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"14":{"isWorking":2}},"11":{"8":{"isWorking":2}},"12":{"13":{"isWorking":2},"31":{"isWorking":3}}},"2005":{"1":{"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"10":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"5":{"isWorking":3},"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"12":{"isWorking":2}}},"2006":{"1":{"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"9":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2},"24":{"isWorking":2},"26":{"isWorking":0}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"5":{"1":{"isWorking":2},"6":{"isWorking":3},"8":{"isWorking":2},"9":{"isWorking":2}},"6":{"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"6":{"isWorking":2}}},"2007":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"4":{"28":{"isWorking":3},"30":{"isWorking":2}},"5":{"1":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"9":{"isWorking":3},"11":{"isWorking":2},"12":{"isWorking":2}},"11":{"5":{"isWorking":2}},"12":{"29":{"isWorking":3},"31":{"isWorking":2}}},"2008":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3},"25":{"isWorking":2}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"4":{"isWorking":0},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"7":{"isWorking":0},"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2}},"11":{"1":{"isWorking":3},"3":{"isWorking":2},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2009":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2},"11":{"isWorking":0}},"2":{"23":{"isWorking":2}},"3":{"9":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"8":{"isWorking":3},"11":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2010":{"1":{"1":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":2},"23":{"isWorking":2},"27":{"isWorking":3}},"3":{"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"3":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"14":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2},"5":{"isWorking":2},"13":{"isWorking":0}},"12":{"31":{"isWorking":3}}},"2011":{"1":{"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"10":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"5":{"isWorking":3},"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}}},"2012":{"1":{"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"9":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"7":{"isWorking":3},"8":{"isWorking":2},"9":{"isWorking":2},"11":{"isWorking":0}},"4":{"28":{"isWorking":3},"30":{"isWorking":2}},"5":{"1":{"isWorking":2},"5":{"isWorking":0},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2},"12":{"isWorking":3}},"6":{"9":{"isWorking":3},"11":{"isWorking":2},"12":{"isWorking":2}},"11":{"5":{"isWorking":2}},"12":{"29":{"isWorking":3},"31":{"isWorking":2}}},"2013":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2014":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"24":{"isWorking":3}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2}},"11":{"3":{"isWorking":2},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2015":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2}},"2":{"20":{"isWorking":3},"23":{"isWorking":2}},"3":{"6":{"isWorking":3},"9":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"4":{"isWorking":2},"8":{"isWorking":3},"11":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2016":{"1":{"1":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"20":{"isWorking":3},"22":{"isWorking":2},"23":{"isWorking":2}},"3":{"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"3":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}}}}};

module.exports = function(obj, cb){

    //USING:
    //
    //generate_calendar({
    //    date_start: '01.01.2016',
    //    payments_count: 41
    //}, function(){
    //
    //});

    if(typeof cb !== 'function') throw new MyError('Не передан cb');

    if(typeof obj !== 'object') return cb(new MyError('Не передан obj'));

    var notWorking = undefined;

    request({
        url: 'http://basicdata.ru/api/json/calend/',
        json: true
    }, function(error, res, body){


        if(!error && res.statusCode == 200){

            notWorking = body;

        }else{

            notWorking = reservData;
            console.log(error);
        }

        function checkDate(date){

            var weekday = date.day();
            var dayOMth = date.date();
            var year = date.year();
            var mth = date.month() + 1;

            var result = undefined;


            if(weekday == 6 || weekday == 0){ // суббота или воскресенье
                if(notWorking.data[year]){
                    if(notWorking.data[year][mth]){
                        if(notWorking.data[year][mth][dayOMth]){
                            if(notWorking.data[year][mth][dayOMth].isWorking == 0 || notWorking.data[year][mth][dayOMth].isWorking == 3){
                                result = true;
                            }else{
                                result = false;
                            }
                        }else{
                            result = false;
                        }
                    }else{
                        result = false;
                    }
                }else{
                    result = false;
                }
            }else{ // пн, вт, ср, чт, пт

                if(notWorking.data[year]){
                    if(notWorking.data[year][mth]){
                        if(notWorking.data[year][mth][dayOMth]){
                            if(notWorking.data[year][mth][dayOMth].isWorking == 2 ){
                                result = false;
                            }else{
                                result = true;
                            }
                        }else{
                            result = true;
                        }
                    }else{
                        result = true;
                    }
                }else{
                    result = true;
                }
            }

            return result;
        }

        var start =             moment(obj.date_start,'DD.MM.YYYY');//.format('YYYY-MM-DD');
        var payments_count =    obj.payments_count;

        var res_array = [];
        var lastDate = undefined;



        for(var i = 0 ; i < payments_count; i++){
            if(lastDate === undefined && i == 0) lastDate = start;

            if(checkDate(lastDate)) {
                res_array.push(lastDate.format('DD.MM.YYYY'));
                lastDate = lastDate.add(1, 'd');
            }else{
                lastDate = lastDate.add(1, 'd');
                i = i-1;
            }

        }

        cb(null,res_array);
        //console.log(res_array, res_array.length);
    });
};
