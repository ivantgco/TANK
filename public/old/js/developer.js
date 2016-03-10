var fileLoader;
var sendQuery = function (obj, cb) {
    if (typeof obj.params=="object"){
        obj.params = JSON.stringify(obj.params);
    }
    $.ajax({
        url: "developer",
        method: "POST",
        data: obj,
        complete: function (res) {
            console.log('complete', res);

        },
        statusCode: {
            200: function (result) {
                console.log('200', result);
                cb(result);
            },
            403: function (result) {
                console.log('200', result);
                cb(result);
            }
        }
    });
};
$(document).ready(function(){
    $(document).on('delivery.connect', function(e, delivery){
        console.log('triggered delivery.connect');
        fileLoader = new FileLoader({delivery:delivery});

        $('.autoUpload').off('click').on('click', function(){
            var inp = $(this);
            if (!fileLoader){
                toastr['error']('fileLoader еще не готов');
                return;
            }
            fileLoader.start({
                success:function(fileUID){
                    inp.val(fileUID.name);
                }
            });
        });
    });



    console.log('document READY');
    $("#btn1").off('click').on('click',function(){
        var o = {
            command:"create",
            object:"Table",
            params:{
                name:'users'
            }
        };
        sendQuery(o,function(r){console.log(r);});
    });
    $("#btn2").off('click').on('click',function(){
        var o = {
            command:"alter",
            object:"Table",
            params:{
                name:'users'
            }
        };
        sendQuery(o,function(r){console.log(r);});
    });
    $("#btn3").off('click').on('click',function(){
        var o = {
            command:"remove",
            object:"action",
            params:{
                id:7
            }
        };
        sendQuery(o,function(r){console.log(r);});
    });
    $("#btn4").off('click').on('click',function(){
        console.log('btn4 clicked');
        var o = {
            command:"get",
            object:"club",
            params:{}
        };
        sendQuery(o,function(r){console.log(r);});

    });

    $("#btn5").off('click').on('click',function(){
        if (!fileLoader){
            console.log('fileLoader еще не готов');
            return;
        }
        fileLoader.start({
            success:function(fileUID){
                //console.log(fileUID);
            }
        });
    });
    $("#btn6").off('click').on('click',function(){
//        $.post('/sendFeedback',{html:"<b>Test sending feedback</b>"},function(r){
//           console.log(r);
//        });
    });
    $("#btn7").off('click').on('click',function(){
        $.post('/updateUserAges',{},function(r){
            alert(r);
            console.log(r);
        });
    });
    /*$("#btn8").off('click').on('click',function(){
        $.post('/rePosition',{},function(r){
            alert(r);
            console.log(r);
        });
    });*/



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
});
