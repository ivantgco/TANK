$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['title', 'published'],
        goToObject: 'admin_article',
        primaryKey: 'id',
        sort: '',
        filters: [
            {
                label: 'Наименование',
                column: 'title',
                type: 'like',
                whereType: 'internal',
                whereTable: ''
            }
        ]
    });

    table.init();

});
