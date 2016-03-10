$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['sort_no', 'url', 'photo'],
        goToObject: 'admin_main_slide',
        primaryKey: 'id',
        sort: ''
    });

    table.init();



});
