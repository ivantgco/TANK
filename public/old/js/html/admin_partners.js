$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['title', 'url'],
        goToObject: 'admin_partner',
        primaryKey: 'id',
        sort: '',
        filters: [
            {
                label: 'Наименование',
                column: 'name',
                type: 'like',
                whereType: 'internal',
                whereTable: ''
            }
        ]
    });

    table.init();

});
