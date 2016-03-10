$(document).ready(function(){

    var confirm_reg = $('#confirm_registration');
    var form_wrapper = $('#form-registration');
    var confirm_edit_club = $('#confirm_edit_club');
    var delete_club = $('#delete_club');

    delete_club.off('click').on('click', function(){
        var o = {
            command: 'remove',
            object: 'club',
            params: {
                id: form_wrapper.data('id')
            }
        };
        o.params.id = form_wrapper.data('id');

        sendQuery(o, function(res){
            console.log(res);
            toastr[res.toastr.type](res.toastr.message);
        });
    });

    confirm_edit_club.off('click').on('click', function(){
        var toSendArr = {};
        var fields = [];
        for(var i=0; i< form_wrapper.find('.fc-field').length; i++){
            var control = form_wrapper.find('.fc-field').eq(i);
            var serverName = control.data('server_name');
            var editor = control.data('editor');
            var val = undefined;
            var val2 = undefined;


            switch (editor){
                case 'text':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'number':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'select':
                    val = control.select2('data').id;
                    val2 = control.select2('data').text;
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'date':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'phone':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'email':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'checkbox':
                    val = control[0].checked;
                    fields.push({
                        name: serverName,
                        val: val
                    });
                    break;
                default :
                    break;
            }
        }

        var params = {};
        for(var i in fields){
            var fld = fields[i];
            params[fld.name] = fld.val;
        }
        var o = {
            command: 'modify',
            object: 'club',
            params: params
        };
        o.params.id = form_wrapper.data('id');

        sendQuery(o, function(res){
            console.log(res);
            toastr[res.toastr.type](res.toastr.message);
        });

    });

    confirm_reg.off('click').on('click', function(){
        var toSendArr = {};
        var fields = [];
        for(var i=0; i< form_wrapper.find('.fc-field').length; i++){
            var control = form_wrapper.find('.fc-field').eq(i);
            var serverName = control.data('server_name');
            var editor = control.data('editor');
            var val = undefined;
            var val2 = undefined;


            switch (editor){
                case 'text':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'number':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'select':
                    val = control.select2('data').id;
                    val2 = control.select2('data').text;
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'date':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'phone':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'email':
                    val = control.val();
                    fields.push({
                        name: serverName,
                        val: val
                    });

                    break;
                case 'checkbox':
                    val = control[0].checked;
                    fields.push({
                        name: serverName,
                        val: val
                    });
                    break;
                default :
                    break;
            }
        }

        console.log(fields);



        var params = {};
        for(var i in fields){
            var fld = fields[i];
            params[fld.name] = fld.val;
        }
        var o = {
            command: 'add',
            object: 'club',
            params: params
        };

        sendQuery(o, function(res){
            console.log(res);
            toastr[res.toastr.type](res.toastr.message);
            document.location.href = "/admin_clubs";
        });

    });
});
