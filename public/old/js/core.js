var CF = {};
(function(){
    CF.cloneObj = function (obj) {
        if (obj == null || typeof(obj) != 'object') {
            return obj;
        }
        var temp = {};
        if (obj.length){
            temp = [];
        }
        for (var key in obj) {
            temp[key] = this.cloneObj(obj[key]);
        }
        return temp;
    };

    CF.getJsonFromUrl = function(){
        var query = location.search.substr(1);
        var result = {};
        query.split("&").forEach(function(part) {
            var item = part.split("=");
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    };
    CF.guid = function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = (c === "x" ? r : r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    };

    CF.sendQuery = function(obj, cb){
        switch (obj.object){
            case 'register_user':
                registration(obj.params,function(response){
                    if(typeof cb == 'function'){
                        cb(response);
                    }
                });
                break;
            case 'login':
                logon(obj.params,function(response){
                    if(typeof cb == 'function'){
                        cb(response);
                    }
                });
                break;
            default:
                var response = {
                    toastr: {
                        type: 'warning',
                        message: 'Объект не указан или не обрабатывается'
                    }
                };
                if(typeof cb == 'function'){
                    cb(response);
                }
                break;
        }
    };

    CF.getTemplate = function(name, cb){
        var url = 'templates/'+name+'.html';
        $.ajax({
            url:url,
            success: function(res, status, xhr){
                if(typeof cb == 'function'){
                    cb(res);
                }
            },
            error: function(res, status, xhr){
                if(typeof cb == 'function'){
                    cb('ERROR');
                }
            }
        });
    };

    CF.validator = {
        date: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s*$/);
            return reg.test(val);
        },
        datetime: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]\s+[0-9][0-9]\:[0-9][0-9]\s*$/);
            return reg.test(val);

        },
        time: function(val){
            var reg = new RegExp(/^\s*[0-9][0-9]\:[0-9][0-9]\s*$/);
            return reg.test(val);

        },
        float: function(val){
            var reg = new RegExp(/^\s*[0-9]+[\.]?[0-9]+\s*$/);
            return reg.test(val);

        },
        notEmpty: function(val){
            return val.length > 0;
        },
        phone: function(val){
            return true;
        },
        email: function(val){
            var reg = new RegExp(/^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/);
            return reg.test(val);
        },
        text: function(val){
            return val.length > 0;
        }
    };

    CF.invalidField = function(elem){
        elem.addClass('invalid');
        window.setTimeout(function(){
            elem.removeClass('invalid');
        }, 4500);
    };

    CF.validField = function(elem){
        elem.removeClass('invalid');
    };

    CF.getControl = function(editor_type, value){
        switch (editor_type){
            case 'text':
                return '<input type="text" data-editor="text" class="form-control cf-field" value="'+value+'"/>';
                break;
            case 'number':
                return '<input type="number" data-editor="number" class="form-control cf-field" value="'+value+'" />';
                break;
            case 'select':
                return '<select data-editor="select" class="form-control cf-field" ><option selected>'+value+'</option></select>';
                break;
            case 'date':
                return '<input type="text" data-editor="date" class="form-control cf_datepicker cf-field" value="'+value+'"/>';
                break;
            case 'phone':
                return '<input type="text" data-editor="phone" class="form-control cf-field maskPhone" value="'+value+'" />';
                break;
            case 'email':
                return '<input type="text" data-editor="email" class="form-control cf-field" value="'+value+'" />';
                break;
            case 'checkbox':
                var checked = (value)? 'checked':'';
                return '<input type="checkbox" data-editor="checkbox" class="cf-field" '+checked+' />';
                break;
            default :
                return '<input type="text" data-editor="text" class="form-control cf-field" value="'+value+'"/>';
                break;
        }
    };

    CF.getEditorHtmlById = function(editor_id){
        switch(editor_id){
            case 1:
                return  '<input type="text" class="form-control time-mm maskTime" placeholder="мм:cc">';
                break;
            case 2:
                return '<input type="number" class="form-control " data-editor_id="'+editor_id+'">';
                break;
            case 3:
                return '<div class="input-group">'+
                            '<input type="text" class="form-control tieBreak1">'+
                            '<div class="input-group-addon "> (</div>'+
                            '<input type="text" class="form-control tieBreak2">'+
                            '<div class="input-group-addon">(</div>'+
                            '<input type="text" class="form-control tieBreak3">'+
                            '<div class="input-group-addon">:</div>'+
                            '<input type="text" class="form-control tieBreak4">'+
                            '<div class="input-group-addon">))</div>'+
                        '</div>';
                break;
        }
    };

    CF.getResultsByEventPart = function(event_part_id){
        var results = [
            {
                title: 'Отжимания',
                units: 'Время',
                editor: CF.getEditorHtmlById(1)
            },
            {
                title: 'Прыжки',
                units: 'Повт.',
                editor: CF.getEditorHtmlById(2)
            },
            {
                title: 'Tie break',
                units: 'Tie break',
                editor: CF.getEditorHtmlById(3)
            }
        ];

        return results;
    };

    CF.toCalendarString = function(str){
        //console.log(str);
        if(!str || str.length == 0){return;}
        var localStr = str;
        var d = localStr.substr(0,2);
        var m = localStr.substr(3,2);
        var y = localStr.substr(6,4);
        return y +'-'+ m +'-'+ d;
    };

}());
