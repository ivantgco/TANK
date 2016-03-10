$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        //id
        //    name
        //photo
        //    city_id
        //address
        //    url
        //phones
        //    emails
        //isAffiliate
        //    created
        //confirmed
        //    published
        //deleted
        //    user_id
        //description
        visible_columns: ['name', 'city', 'phones', 'emails', 'isAffiliate', 'address'],
        //'id','action_id','status_name_sys','video_url'
        goToObject: 'admin_club',
        primaryKey: 'id',
        sort: '',
        filters: [
            {
                label: 'Наименование',
                column: 'name',
                type: 'like',
                whereType: 'internal',
                whereTable: ''
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
            }
        ]
    });

    table.init();

});
