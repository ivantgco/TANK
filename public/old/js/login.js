var logon = function (obj, cb) {
    if (typeof cb !=="function"){
        cb = function(){console.log('В функцию logon не передан callback');};
    }
    $.ajax({
        url: "/login",
        method: "POST",
        data: obj,
        complete: function () {

        },
        statusCode: {
            200: function () {
                window.location.reload();
               /* var response = {
                    toastr: {
                        type: 'success',
                        message: 'Успех'
                    }
                };
                cb(response);*/
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
var logout = function (obj, cb) {

    if (typeof cb !=="function"){
        cb = function(){console.log('В функцию logon не передан callback');};
    }
    $.ajax({
        url: "/logout",
        method: "POST",
        data: obj,
        complete: function () {

        },
        statusCode: {
            200: function () {
                window.location.reload();
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
