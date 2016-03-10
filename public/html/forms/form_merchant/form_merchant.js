(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    formInstance.lowerButtons = [
        {
            title: 'Деньги отправлены',
            color: "green",
            icon: "fa-money",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['money_sent'],
                matching: ['not_equal'],
                colValues: [false]
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Скан платежки):</label><input id="upload_payment_account" class="form-control" type="text"/></div></div></div>';

                bootbox.dialog({
                    title: 'Загрузите скан платежки',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Загрузить',
                            callback: function () {

                                var filename = $('#upload_payment_account').val();

                                var o = {
                                    command: 'makePayment',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        filename: filename
                                    }
                                };

                                socketQuery(o, function (res) {
                                    formInstance.reload();
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function () {

                            }
                        }
                    }
                });

                $('#upload_payment_account').off('click').on('click', function(){
                    var loader = MB.Core.fileLoader;
                    loader.start({
                        params:{
                            not_public:true
                        },
                        success: function (uid) {
                            $('#upload_payment_account').val(uid.name);
                        }
                    });
                });


            }
        },
        {
            title: 'Отправить уведомление в банк',
            color: "green",
            icon: "fa-comment-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['bank_notified'],
                matching: ['not_equal'],
                colValues: [false]
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                //var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Скан платежки):</label><input id="upload_payment_account" class="form-control" type="text"/></div></div></div>';

                bootbox.dialog({
                    title: 'Отправить календарь в банк',
                    message: ' ',
                    buttons: {
                        success: {
                            label: 'Отправить',
                            callback: function(){

                                var o = {
                                    command: 'notifyBank',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();
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
            }
        }
    ];

}());