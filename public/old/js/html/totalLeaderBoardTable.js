$(document).ready(function() {
    var lbTables = $('.totalLeaderBoardTable');

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
                lb_gender = 'MALE';
                lb_age = '40';
                break;
            case 'male40':
                lb_gender = 'MALE';
                lb_age = '>40';
                break;
            case 'famale':

                lb_gender = 'FAMALE';
                lb_age = '40';
                break;
            case 'famale40':
                lb_gender = 'FAMALE';
                lb_age = '>40';
                break;
            default:

                break;
        }

        var lb_table = new CF.Table({
            getObject: lb_getObj,
            wrapper: lbTable,
            //visible_columns: ['position', 'photo', 'fio', 'rating'],
            gender_sys_name: lb_gender,
            age: lb_age,
            action_id: 'all',
            defaultWhere: lb_whereObj,
            where: lb_whereObj,
            primaryKey: 'id',
            isLeaderBoard: false,
            isAllLeaderBoard: true
        });
        lb_table.init();
        console.log(lbTables.length);
    }
});