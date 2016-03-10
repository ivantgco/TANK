$(document).ready(function(){

    var lbTables = $('.leaderBoardTable');

    for(var l=0; l<lbTables.length; l++){
        var lbTable = lbTables.eq(l);
        var lb_action_id = lbTable.data('action_id');
        var lb_getObj = lbTable.data('get_object');
        var lb_rangeWhere = lbTable.data('range_where');
        var lb_gender = '';
        var lb_age = '';
        var lb_whereObj = {};
        switch(lb_rangeWhere){
            case 'male':
                //lb_whereObj['gender'] = {
                //    sys_name: 'MALE'
                //};
                //lb_whereObj['users'] = {
                //    age: '<40'
                //};
                lb_gender = 'MALE';
                lb_age = '40';
                break;
            case 'male40':
                //lb_whereObj['gender'] = {
                //    sys_name: 'MALE'
                //};
                //lb_whereObj['users'] = {
                //    age: '<40'
                //};
                lb_gender = 'MALE';
                lb_age = '>40';
                break;
            case 'famale':
                //lb_whereObj['gender'] = {
                //    sys_name: 'FAMALE'
                //};
                //lb_whereObj['users'] = {
                //    age: '>=40'
                //};
                lb_gender = 'FAMALE';
                lb_age = '40';
                break;
            case 'famale40':

                //lb_whereObj['gender'] = {
                //    sys_name: 'FAMALE'
                //};
                //lb_whereObj['users'] = {
                //    age: '<40'
                //};
                lb_gender = 'FAMALE';
                lb_age = '>40';
                break;
            default:

                break;
        }

        var lb_table = new CF.Table({
            getObject: lb_getObj,
            wrapper: lbTable,
            gender_sys_name: lb_gender,
            age: lb_age,
            action_id: lb_action_id,
            defaultWhere: lb_whereObj,
            where: lb_whereObj,
            primaryKey: 'id',
            isLeaderBoard: true
        });
        lb_table.init();
        console.log(lbTables.length);
    }


    var tableWrapper = $('.initMeTable');

    var action_id = tableWrapper.data('action_id');
    var part_id = tableWrapper.data('part_id');
    var getObj = tableWrapper.data('get_object');
    var rangeWhere = tableWrapper.data('range_where');
    var type = tableWrapper.data('type');

    for(var i=0; i< tableWrapper.length; i++){
        var tbl = tableWrapper.eq(i);

        action_id = tbl.data('action_id');
        part_id = tbl.data('part_id');
        getObj = tbl.data('get_object');
        rangeWhere = tbl.data('range_where');
        type = tableWrapper.data('type');

        var whereObj = {
            action_parts: {
                action_id: action_id,
                id: part_id
            },
            result_statuses: {
                sys_name: '<>IN_HISTORY'
            }
        };

        switch(rangeWhere){
            case 'male':
                whereObj['gender'] = {
                    sys_name: 'MALE'
                };
                whereObj['users'] = {
                    age: '<40'
                };
                break;
            case 'male40':
                whereObj['gender'] = {
                    sys_name: 'MALE'
                };
                whereObj['users'] = {
                    age: '>=40'
                };
                break;
            case 'famale':
                whereObj['gender'] = {
                    sys_name: 'FAMALE'
                };
                whereObj['users'] = {
                    age: '<40'
                };
                break;
            case 'famale40':

                whereObj['gender'] = {
                    sys_name: 'FAMALE'
                };
                whereObj['users'] = {
                    age: '>=40'
                };
                break;
            default:

                break;
        }


        var table = new CF.Table({
            getObject: getObj,
            wrapper: tbl,
            visible_columns: ['user_surname', 'concat_result', 'status_name', 'video_url', 'user_firstname', 'club'],
            sort: 'position',
            specialColumns: [
                {
                    column: 'video_url',
                    type: 'link'
                }
            ],
            type: type,
            defaultWhere: CF.cloneObj(whereObj),
            where: whereObj,
            goToObject: '',
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
                    returnName: 'name',
                    whereType: 'external',
                    whereTable: 'clubs'
                }
            ]
        });
        table.init();
    }



});
