(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant_calendar', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var days_table = formInstance.tblInstances[0];

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);


    formInstance.lowerButtons = [
        {
            title: 'Оплатить след. день (Bank API test)',
            color: "green",
            icon: "fa-money",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {

                var data = formInstance.data.data[0];

                function getNearrestPayment(cb){

                    var o = {
                        command: 'get',
                        object: 'Merchant_payment',
                        params: {
                            where: [
                                {
                                    key: 'calendar_id',
                                    val1: data.id
                                },
                                {
                                    key: 'bank_id',
                                    val1: data.bank_id
                                },
                                {
                                    key: 'merchant_id',
                                    val1: data.merchant_id
                                }
                            ],
                            sort: {
                                columns: [
                                    'payment_date'
                                ],
                                direction: 'ASC'
                            }
                        }
                    };

                    socketQuery(o, function(res){

                        for(var i in res.data){
                            var d = res.data[i];
                            if(d.status_sysname == 'PENDING'){
                                return cb(d);
                            }
                        }

                    });


                }

                function getSecretWord(merchant_id, bank_id, cb){
                    var o = {
                        command: 'get',
                        object: 'Bank_merchant',
                        params: {
                            param_where: {
                                bank_id: bank_id,
                                merchant_id: merchant_id
                            }
                        }
                    };

                    socketQuery(o, function(res){
                        cb(res.data[0].secret);

                    });
                }

                getSecretWord(data.merchant_id, data.bank_id, function(secret){

                    console.log('secret', secret, data.merchant_id);

                    getNearrestPayment(function(payment){

                        var date =      payment.payment_date.substr(0,10);
                        var amount =    payment.pending_amount;

                        var o = {
                            bank_id:        data.bank_id,
                            token:          secret + date +  data.merchant_id,
                            tid:            'TID',
                            merchant_id:    data.merchant_id,
                            date:           date,
                            amount:         amount,
                            calendar_id:    data.id
                        };

                        var html =  '<div class="form-group">' +
                            '<label>Token:</label>' +
                            '<input type="text" id="token" class="form-control" value="'+ o.token+'"/>' +
                            '</div>' +
                            '<div class="form-group">' +
                            '<label>Дата:</label>' +
                            '<input type="text" id="date" class="form-control" value="'+ o.date+'"/>' +
                            '</div>' +
                            '<div class="form-group">' +
                            '<label>Amount:</label>' +
                            '<input type="text" id="amount" class="form-control" value="'+ o.amount+'"/>' +
                            '</div>' ;


                        bootbox.dialog({
                            title: 'Выполнить запрос insertPayment (Bank Api)',
                            message: html,
                            buttons: {
                                success: {
                                    label: 'Отправить',
                                    callback: function () {

                                        o.amount = $('#amount').val();
                                        o.date = $('#date').val();
                                        o.token = $('#token').val();

                                        console.log(o);

                                        $.post('/bank/insertPayment', o, function(response){
                                            console.log(formInstance);
                                            formInstance.reload();
                                            toastr['info'](JSON.stringify(response));

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

                    });





                });




                //var data = formInstance.data.data[0];
                //
                //var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Скан платежки):</label><input id="upload_payment_account" class="form-control" type="text"/></div></div></div>';
                //
                //bootbox.dialog({
                //    title: 'Загрузите скан платежки',
                //    message: html,
                //    buttons: {
                //        success: {
                //            label: 'Загрузить',
                //            callback: function () {
                //
                //                var o = {
                //                    command: 'makePayment',
                //                    object: formInstance.class,
                //                    client_object: formInstance.client_object,
                //                    params: {
                //                        id: data.id
                //                    }
                //                };
                //
                //                socketQuery(o, function (res) {
                //                    formInstance.reload();
                //                });
                //            }
                //        },
                //        error: {
                //            label: 'Отмена',
                //            callback: function () {
                //
                //            }
                //        }
                //    }
                //});
            }
        }
    ]


}());