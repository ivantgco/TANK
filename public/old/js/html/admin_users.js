$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['firstname', 'surname', 'gender', 'city', 'club', 'age'],
        //'id','action_id','status_name_sys','video_url'
        goToObject: '',
        primaryKey: 'id',
        sort: '',
        filters: [
            {
                label: 'Фамилия атлета',
                column: 'surname',
                type: 'like'
            },
            {
                label: 'Имя атлета',
                column: 'firstname',
                type: 'like'
            },
            {
                label: 'Город',
                column: 'id',
                type: 'select',
                tableName: 'city',
                returnId: 'id',
                returnName: 'title',
                whereType: 'external',
                whereTable: 'cities'
            },
            {
                label: 'Клуб',
                column: 'id',
                type: 'select',
                tableName: 'club',
                returnId: 'id',
                returnName: 'title',
                whereType: 'external',
                whereTable: 'clubs'
            }
        ]
    });

    table.init();

});
