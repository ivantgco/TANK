$(document).ready(function(){

    var tableWrapper = $('.initMeTable');

    var action_id = tableWrapper.data('action_id');
    var part_id = tableWrapper.data('part_id');
    var getObj = tableWrapper.data('get_object');

    for(var i=0; i< tableWrapper.length; i++){
        var tbl = tableWrapper.eq(i);

        action_id = tbl.data('action_id');
        part_id = tbl.data('part_id');
        getObj = tbl.data('get_object');

        var table = new CF.Table({
            getObject: getObj,
            wrapper: tbl,
            visible_columns: ['user_surname', 'concat_result', 'status_name', 'video_url', 'user_firstname'],
            sort: 'position',
            goToObject: 'admin_judge_result',
            specialColumns: [
                {
                    column: 'video_url',
                    type: 'link'
                }
            ],
            defaultWhere: {
                action_parts: {
                    action_id: action_id,
                    id: part_id
                },
                result_statuses:{
                    sys_name: '<>IN_HISTORY'
                }
            },
            where: {
                action_parts: {
                    action_id: action_id,
                    id: part_id
                },
                result_statuses:{
                    sys_name: '<>IN_HISTORY'
                }
            },
            primaryKey: 'id',
            filters: [
                {
                    label: 'Фамилия атлета',
                    column: 'surname',
                    type: 'like',
                    whereType: 'external',
                    whereTable: 'users'
                },
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
    }



});
