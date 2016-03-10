$(document).ready(function(){
    var accept = $('.acceptResult');
    var reject = $('.rejectResult');
    var action_part_id = accept.data('part_id');

    accept.off('click').on('click', function(){
        var id = $(this).data('id');
        bootbox.dialog({
            title: 'Подтверждение',
            message: '<div class="control-group"><label>Укажите результат, сколько вы насчитали?</label><input type="text" class="form-control judge-approved-result" /><label>Если насчитали столько же, сколько заявлено, оставьте поле пустым.</label></div>',
            buttons: {
                success: {
                    label: 'Подтвердить',
                    callback: function(){
                        var jar = $('.judge-approved-result');
                        var o = {
                            command: 'approve',
                            object: 'results',
                            params: {
                                id: id,
                                status: 'ACCEPTED'
                            }
                        };
                        if(jar.val()){
                            o.params['approved_result'] = jar.val();
                        }

                        sendQuery(o, function(res){
                            toastr[res.toastr.type](res.toastr.message);
                            document.location.reload();
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

    reject.off('click').on('click', function(){
        var id = $(this).data('id');
        bootbox.dialog({
            title: 'Подтверждение',
            message: 'Укажите причину отклонения заявки: <input type="text" class="rejectReason form-control" />',
            buttons: {
                success: {
                    label: 'Отклонить',
                    callback: function(){
                        var o = {
                            command: 'approve',
                            object: 'results',
                            params: {
                                id: id,
                                status: 'REJECTED',
                                action_part_id: action_part_id,
                                rejectReason: $('.rejectReason').val()
                            }
                        };
                        sendQuery(o, function(res){
                            toastr[res.toastr.type](res.toastr.message);
                            document.location.reload();
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
