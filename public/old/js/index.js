var sendQuery = function (obj, cb) {
    if (typeof obj.params=="object"){
        obj.params = JSON.stringify(obj.params);
    }
    $.ajax({
        url: "/api",
        method: "POST",
        data: obj,
        complete: function (res) {
            console.log('complete', res);

        },
        statusCode: {
            200: function (result) {
                console.log('200', result);
                cb(result);
            },
            403: function (result) {
                console.log('200', result);
                cb(result);
            }
        }
    });
};
function initModalSelect(elem){
    var $elem = $(elem);
    if($elem.parents('.filterWrapper').length > 0){
        return;
    }

    var name = $elem.data('name');
    $elem.select2({
        query: function(query){
            var data = {results: []};

            var o = {
                command: 'get',
                object: $elem.data('table'),
                params: {
                    /*where: {},*/
                    limit: 100
                }
            };
            if(query.term.length > 0){
                o.params.where = {};
                o.params.where[name] = '*'+query.term+'*';
            }


            sendQuery(o, function(res){
                for(var i in res.data){
                    var item = res.data[i];
                    data.results.push({
                        id: item.id,
                        text: item[name]
                    });
                }

                console.log(res);

                query.callback(data);
            });
        },
        initSelection: function(element, callback){
            var data = {id: element.val(), text: $(element).data('text')};
            callback(data);
        }
    });
}
$(document).ready(function(){

    var aU_firstname = '';
    var aU_surname = '';
    var aU_phone = '';
    var aU_email = '';

    if($('#auth-user-firstname').length > 0){
        aU_firstname = $('#auth-user-firstname').val();
        aU_surname = $('#auth-user-surname').val();
        aU_phone = $('#auth-user-phone').val();
        aU_email = $('#auth-user-email').val();
    }


    (function(){
        $('#logo').off('click').on('click', function(){
            if($(this).hasClass('adminHome')){
                document.location.href = './admin';
            }else{
                document.location.href = './';
            }
        });

        $('.fc_datepicker').datepicker({
            format: "dd.mm.yyyy",
            todayBtn: "linked",
            language: "ru",
            autoclose: true
        });

        $('.maskedPhone').mask('(999) 999-99-99');
        $('.maskTime').mask('99:99');

        //$('select').select2();




        $('input.select2, input.select2').each(function(idx, elem){
            var $elem = $(elem);
            $elem.parents('.bootbox').removeAttr('tabindex');

            console.log($elem.parents('.bootbox'));

            if($elem.parents('.filterWrapper').length > 0){
                return;
            }

            var name = $elem.data('name');
            $elem.select2({
                query: function(query){
                    var data = {results: []};

                    var o = {
                        command: 'get',
                        object: $elem.data('table'),
                        params: {
                            /*where: {},*/
                            limit: 100
                        }
                    };
                    if(query.term.length > 0){
                        o.params.where = {};
                        o.params.where[name] = '*'+query.term+'*';
                    }


                    sendQuery(o, function(res){

                        if($elem.hasClass('filter-ctrl')){
                            data.results.push({
                                id: '-10',
                                text: '-'
                            });
                        }
                        for(var i in res.data){
                            var item = res.data[i];
                            data.results.push({
                                id: item.id,
                                text: item[name]
                            });
                        }

                        console.log(res);

                        query.callback(data);
                    });
                },
                initSelection: function(element, callback){
                    var data = {id: element.val(), text: $(element).data('text')};
                    callback(data);
                }
            });

            if($elem.data('server_name') == "gender_id"){
                var userPhotoWrapper = $('.user-photo-wrapper');
                var userPhotoImg = userPhotoWrapper.find('img');

                $elem.off('change').on('change', function(){
                    var userPhotoInput = $('input.fc-field[data-server_name="photo"]');
                    var val = $(this).select2('data').id;

                    if(userPhotoInput.val() == ''){
                        if(val == 1){
                            userPhotoImg.attr('src', 'img/user_default_m.jpg');
                        }else if(val == 2){
                            userPhotoImg.attr('src', 'img/user_default_f.jpg');
                        }else{
                            userPhotoImg.attr('src', 'img/user_default_m.jpg');
                        }
                    }
                });
            }

        });

        var cf_text_editors = $('.cf_text_editor');
        for(var i=0; i<cf_text_editors.length; i++){
            var te = cf_text_editors.eq(i)[0];
            var val = $(te).attr('value');
            CKEDITOR.replace(te);
            CKEDITOR.instances[$(te).attr('id')].setData(val);
        }

        var cf_text_editors_simple = $('.cf_text_editor_simple');
        for(var i=0; i<cf_text_editors_simple.length; i++){
            var te = cf_text_editors_simple.eq(i)[0];
            CKEDITOR.replace(te);
        }

        $('.open-calendar').off('click').on('click', function(){
            var calendarWrapper = $('.calendar-wrapper');
            if($(this).hasClass('opened')){
                $(this).removeClass('opened');
                calendarWrapper.hide(0);
            }else{
                $(this).addClass('opened');
                calendarWrapper.show(0);
            }
        });


        var games;
        var wows;
        function getEvents(cb){
            sendQuery({
                command: 'get',
                object: 'action',
                params: {
                    where: {
                        action_types:{
                            sys_name:'GAMES'
                        },
                        action_statuses: {
                            sys_name: 'OPENED'
                        }
                    }
                }
            }, function(res){
                games = res;

                sendQuery({
                    command: 'get',
                    object: 'action',
                    params: {
                        where: {
                            action_types:{
                                sys_name:'WOD_OF_WEEK'
                            },
                            action_statuses: {
                                sys_name: 'OPENED'
                            }
                        }
                    }
                }, function(res){
                    wows = res;
                    if(typeof cb == 'function'){
                        cb();
                    }
                });
            });
        }

        /*getEvents(function(){
            console.log('EVENTS', games, wows);
            var calEvents = [];
            for(var g in games.data){
                var game = games.data[g];
                calEvents.push({
                    title  : '',
                    className: 'games_event',
                    url: 'event?id='+game.id,
                    start  : CF.toCalendarString(game.date_start) //'2015-03-18',
                });
            }

            for(var w in wows.data){
                var wow = wows.data[w];
                calEvents.push({
                    title  : '',
                    className: 'wow_event',
                    url: 'wow?id='+wow.id,
                    start  : CF.toCalendarString(wow.date_start) //'2015-03-18',
                });
            }

            //console.log('AAAAAAAA calEvents', calEvents);

            $('.calendar-wrapper').fullCalendar({
                lang: 'ru',
                aspectRatio: 1,
                contentHeight: 'auto',
                events: calEvents,
                eventColor: '#282828'
            });

            for(var i = 0; i < $('.calendar-wrapper').find('.games_event').length; i++){
                var e = $('.calendar-wrapper').find('.games_event').eq(i);
                //if(e.parents('.fc-widget-content').eq(0)){}
            }

        });*/





        //type == true (COLLAPSE)
        //type == false (EXPAND)
        function collapseBlock(wrapper, type, cb){
            var content = wrapper.find('.collapseContent');
            if(type){
                content.hide(0);
            }else{
                content.show(0);
            }
            if(typeof cb == 'function'){
                cb();
            }
        }


        $('.collapseBtn').off('click').on('click', function(){
            var parent = $(this).parents('.collapseable');
            var $self = $(this);
            if($(this).hasClass('collapsed')){
                collapseBlock(parent, false, function(){
                    $self.html('<div class="fa fa-minus"></div> Свернуть').removeClass('collapsed');
                });
            }else{
                collapseBlock(parent, true, function(){
                    $self.html('<div class="fa fa-plus"></div> Развернуть').addClass('collapsed');
                });
            }
        });

        $('.input-group-addon').off('click').on('click', function(){
            var grp = $(this).parents('.input-group').eq(0);
            var inp = grp.find('input').eq(0);
            inp.trigger('click');
            inp.focus();
        });

    }());


});








