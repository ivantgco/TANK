(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть календарь',
            disabled: function(){
                return false;
            },
            callback: function(){
                //tableInstance.openRowInModal();
                alert('open calendar');
            }
        },
        {
            name: 'option2',
            title: 'Перенести в конец',
            disabled: function(){
                return false;
            },
            callback: function(){
                //tableInstance.openRowInModal();
                alert('Push');
            }
        }

    ];

}());