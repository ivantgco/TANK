$(document).ready(function(){

    var userPhotoWrapper = $('.user-photo-wrapper');
    var userPhotoImg = userPhotoWrapper.find('img');

    $(document).on('delivery.connect', function(e, delivery){
        var fileLoader = new FileLoader({delivery:delivery});
        $('.userPhotoInput').off('click').on('click', function(){
            var inp = $(this);
            if (!fileLoader){
                toastr['error']('fileLoader еще не готов');
                return;
            }
            fileLoader.start({
                success:function(fileUID){
                    inp.val(fileUID.name);
                    console.log(fileUID);
                    userPhotoImg.attr('src', 'upload/'+fileUID.name);
                }
            });
        });
    });

    $('.user-photo-clear').off('click').on('click', function(){
        var userPhotoInput = $('input.fc-field[data-server_name="photo"]');
        if(userPhotoInput.val().length > 0){
            userPhotoInput.val('');
            var val = $('[data-server_name="gender_id"]').select2('data').id;

            console.log(val);

            if(val == 1){
                userPhotoImg.attr('src', 'img/user_default_m.jpg');
            }else if(val == 2){
                userPhotoImg.attr('src', 'img/user_default_f.jpg');
            }else{
                userPhotoImg.attr('src', 'img/user_default_m.jpg');
            }
        }
    });

    var fields = $('.fc-field');
    var confirm = $('.save_profile');
    function acquireData(){
        var data = [];
        for(var i=0; i<fields.length; i++){
            var fld = fields.eq(i);
            if(fld.attr('type') != 'hidden'){
                if(fld.hasClass('select2')){
                    data.push({
                        name: fld.parents('td').eq(0).children('input[type="hidden"]').eq(0).data('server_name'),
                        val: fld.select2('data').id
                    });
                }else{
                    data.push({
                        name: fld.data('server_name'),
                        val: fld.val()
                    });
                }
            }
        }
        return data;
    }


    confirm.off('click').on('click', function(){
        var data = acquireData();
        var o = {
            command: 'modifyProfile',
            object: 'user',
            params:{}
        };
        for(var i in data){
            o.params[data[i].name] = data[i].val
        }
        console.log(o);

        sendQuery(o, function(res){
            toastr[res.toastr.type](res.toastr.message);
        });
    });


});
