$(document).ready(function(){

    var saveBtn = $('.saveEventButton');

    saveBtn.off('click').on('click', function(){
        var action_id = $(this).data('id');
        var o;
        if(action_id == 'new'){
            o = {
                command: 'add',
                object: 'action',
                params: {}
            };
        }else{
            o = {
                command: 'modify',
                object: 'action',
                params: {
                    id: action_id
                }
            };
        }

        $('.fc-event-field').each(function(idx, elem){
            if($(this).hasClass('select2-container')){
                return;
            }
            var $elem = $(elem);
            var column = $elem.data('server_name');
            var val = (!$elem.val() || $elem.val() == 'undefined')? "" : $elem.val();
            if($elem.hasClass('cf_text_editor')){
                val = CKEDITOR.instances[action_id + '-' + column].getData();
                console.log(CKEDITOR.instances[action_id + '-' + column]);
            }
            o.params[column] = val;
        });

        console.log(o);

        sendQuery(o, function(res){
            console.log(res);
            if(res.code == 0){
                if(action_id == 'new'){
                    var id = res.data.id;
                    sendQuery({
                        command:'add',
                        object: 'action_part',
                        params: {
                            action_id: id,
                            title: 'Первый этап'
                        }
                    }, function (res) {
                        toastr['success']('Мероприятие создано');
                        document.location.href = 'admin_event?id='+id;
                    });
                }else{
                    toastr['success']('Мероприятие сохранено');
                }
            }else{
                toastr[res.toastr.type](res.toastr.message);
            }
        });
    });

    var savePart = $('.save-edit-event-part');

    savePart.off('click').on('click', function(){
        var action_id = $(this).data('action_id');
        var part_id = $(this).data('id');
        var tab = $(this).parents('.e-event-part-wrapper');
        var o = {
            command: 'modify',
            object: 'action_part',
            params: {
                action_id: action_id,
                id: part_id
            }
        };

        tab.find('.fc-event-part-field').each(function(idx, elem){
            if($(this).hasClass('select2-container')){
                return;
            }
            var $elem = $(elem);
            var column = $elem.data('server_name');
            var val = (!$elem.val() || $elem.val() == 'undefined')? "" : $elem.val();
            if($elem.hasClass('cf_text_editor')){
                val = CKEDITOR.instances[part_id + '-' + column].getData();//$('#cke_' + part_id + '-' + column);
                console.log(CKEDITOR.instances[part_id + '-' + column]);
            }



            console.log(column, val);

            o.params[column] = val;
        });

        console.log(o);
        sendQuery(o, function(res){
            console.log(res);
            toastr[res.toastr.type](res.toastr.message);
        });

    });

    var addEventPart = $('#add-event-part');

    addEventPart.off('click').on('click', function(){
        var action_id = $(this).data('action_id');

        bootbox.dialog({
            title: 'Введите название этапа',
            message: '<input type="text" class="form-control new_part_name" placeholder="Название нового этапа"/>',
            buttons: {
                success: {
                    label: 'Создать этап',
                    callback: function(){
                        var val = (!$('.new_part_name').val() || $('.new_part_name').val() == "")? "Новый этап": $('.new_part_name').val();
                        var o = {
                            command: 'add',
                            object: 'action_part',
                            params: {
                                action_id: action_id,
                                title: val
                            }
                        };
                        sendQuery(o, function(res){
                            console.log(res);
                            toastr[res.toastr.type](res.toastr.message);
                            document.location.reload();
                        });
                    }
                },
                error: {
                    label: 'Отмена',
                    callback: function(){}
                }
            }
        });
    });

    var eventMailing = $('.event-mailing');

    eventMailing.off('click').on('click', function(){
        var id = $(this).data('action_id');

        var action;
        sendQuery({
            command:'get',
            object: 'action',
            params: {
                where: {
                    id: id
                }
            }
        }, function(res){
            if(res.code == 0){
                action = res.data[0];
                var tpl = 'Доброго времени суток!<br/>' +
                          'Приглашаем вас принять участие в нашем мероприятии {{title}}, открытие которого намечено на {{date_start}}.<br/>' +
                          'Кратко о мероприятии:<br/>' +
                          '{{{description1}}}<br/>' +
                          '<a href="http://cfft.ru/wow?id='+id+'">Принять участие!</a><br/><br/><br/>' +
                          'С уважением, администрация сайта <a href="http://cfft.ru">cfft.ru</a>';

                var html = '' +
                    '<div class="form-group"><label>Тема письма:</label><input value="Приглашение с сайта cfft.ru" type="text" class="form-control mailing-subject" /></div>'+
                    '<div class="form-group"><label>Сообщение:</label><textarea rows="5" id="mailing-html" class="form-control"></textarea></div>';
                var editorInst;

                bootbox.dialog({
                    title: "Разослать мероприятие",
                    message: html,
                    className: "largeBB",
                    buttons: {
                        success: {
                            label: 'Отправить',
                            callback: function(){
                                var subject = $('.mailing-subject');

                                $.post('/sendSubscribe',{subject:subject.val() , html: editorInst.getData() },function(r){
                                    toastr[r.toastr.type](r.toastr.message);
                                });
                            }
                        }
                    }
                });

                var are = $('#mailing-html')[0];
                CKEDITOR.replace(are);
                var planeText = Mustache.to_html(tpl, action);
                editorInst = CKEDITOR.instances['mailing-html'];
                editorInst.setData(planeText);
            }
        });
    });

    var removeEvent = $('.remove-event');

    removeEvent.off('click').on('click', function(){
        var id = $(this).data('action_id');
        var _t = this;

        bootbox.dialog({
            title: 'Подтверждение',
            message: 'Вы уверены, что хотите удалить данное мероприятие?',
            buttons: {
                success: {
                    label: 'Подтвердить',
                    callback: function(){
                        var o = {
                            command: 'remove',
                            object: 'action',
                            params: {
                                id: id
                            }
                        };

                        sendQuery(o, function(res){
                            if(res.code == 0){
                                $(_t).parents('li.action').remove();
                            }
                            toastr[res.toastr.type](res.toastr.message);
                        });
                    }
                },
                error: {
                    label: 'Отмена',
                    callback: function(){

                    }
                }
            }
        });

    });

    var removePart = $('.remove-event-part');

    removePart.off('click').on('click', function(){
        var action_id = $(this).data('action_id');
        var id = $(this).data('id');
        var _t = this;
        bootbox.dialog({
            title: 'Подтверждение',
            message: 'Вы уверены, что хотите удалить данный этап мероприятия?',
            buttons: {
                success: {
                    label: 'Подтвердить',
                    callback: function(){
                        var o = {
                            command: 'remove',
                            object: 'action_part',
                            params: {
                                action_id: action_id,
                                id: id
                            }
                        };

                        sendQuery(o, function(res){
                            if(res.code == 0){
                                document.location.reload();
                            }
                            toastr[res.toastr.type](res.toastr.message);
                        });
                    }
                },
                error: {
                    label: 'Отмена',
                    callback: function(){

                    }
                }
            }
        });
    });


});