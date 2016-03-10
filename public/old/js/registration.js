var registration = function (obj, cb) {
    $.ajax({
        url: "/registration",
        method: "POST",
        data: obj,
        complete: function () {

        },
        statusCode: {
            200: function (result) {
                if(result.code == 0){
                    $('#form-registration').remove();
                    $('#after-registration').show(0);
                    cb(result);
                }else{

                }

                toastr[result.toastr.type](result.toastr.message);
            },
            403: function (result) {
                var res = JSON.parse(result.responseText);
                var message = res.message;
                var response = {
                    toastr: {
                        type: 'error',
                        message: message
                    }
                };
                cb(response);
            }
        }
    });
};

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


    //$(document.forms['form-registration']).on('submit',function(){
    //    var form = $(this);
    //    var obj = form.serialize();
    //    console.log(obj);
    //    registration(obj, form);
    //    return false;
    //});
});

