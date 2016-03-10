$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['name'],
        goToObject: 'admin_event_type',
        primaryKey: 'id',
        sort: ''
    });

    table.init();

});
