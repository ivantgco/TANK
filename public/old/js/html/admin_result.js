$(document).ready(function(){

    var tableWrapper = $('.initMeTable');
    var getObj = tableWrapper.data('get_object');
    var table = new CF.Table({
        getObject: getObj,
        wrapper: tableWrapper,
        visible_columns: ['action_name', 'action_title', 'action_part', 'user_firstname', 'user_surname', 'concat_result', 'status_name', 'club'],
        //'id','action_id','status_name_sys','video_url'
        goToObject: 'admin_judge_result',
        primaryKey: 'id',
        where: {
            result_statuses:{
                sys_name: '<>IN_HISTORY'
            }
        },
        sort: 'position',
        filters: [
            {
                label: 'Мероприятие',
                column: 'action_id',
                type: 'select',
                tableName: 'action',
                returnId: 'id',
                returnName: 'title',
                whereType: 'external',
                whereTable: 'action_parts'
            },
            {
                label: 'Этап',
                column: 'title',
                type: 'like',
                whereType: 'external',
                whereTable: 'action_parts'
            },
            {
                label: 'Фамилия атлета',
                column: 'surname',
                type: 'like',
                whereType: 'external',
                whereTable: 'users'
            },
            //{
            //    label: 'Результат',
            //    column: 'concat_result',
            //    type: 'like'
            //},
            {
                label: 'Статус',
                column: 'status_id',
                type: 'select',
                tableName: 'result_statuses',
                returnId: 'id',
                returnName: 'name',
                whereType: 'internal',
                whereTable: ''
            }
        ]
    });

    table.init();

});
