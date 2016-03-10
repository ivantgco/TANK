(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    //tableInstance.ct_instance.lowerButtons = [
    //    {
    //        title: 'Загнать тестовую транзакцию',
    //        color: "dark",
    //        icon: 'fa-plus',
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: [],
    //            matching: [],
    //            colValues: []
    //        }],
    //        handler: function() {
    //            var o = {
    //                command: 'add',
    //                object: 'merchant_payment_registry',
    //                client_object: 'tbl_merchant_payment_registry',
    //                params: {
    //                    merchant_id: tableInstance.parent_id,
    //                    datetime: '15.12.2015 16:00:00',
    //                    is_default: false,
    //                    amount: 15000,
    //                    complete_percent:1,
    //                    total_paid: 15000,
    //                    total_to_pay: 14850000
    //                }
    //            };
    //            socketQuery(o, function(res){
    //                //tableInstance.reload();
    //            });
    //
    //        }
    //    }
    //];
}());




