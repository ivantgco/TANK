var socket = io.connect();
var delivery;
socket.on('connect', function (data) {
//    toastr['success']('Соединение с сервером установлено.');
    console.log("Соединение с сервером установлено.");
    var counter = 0;
    if (typeof Delivery!=="undefined"){
        var delivery1 = new Delivery(socket);
        delivery1.on('delivery.connect',function(delivery0){
            delivery = delivery0;
            $(document).trigger('delivery.connect',[delivery0]);
        });

    }
});


socket.on('disconnect', function (data) {
    console.warn('Соединение с сервером прервано.');
});

socket.on('error', function (data) {
    console.log('Сокет не может подключиться');
});

socket.on('message', function (obj) {
    /*if (typeof obj !== "object") {
        console.log("socket.on('message'):");
        console.log(obj);
        return;
    }
    var mode = obj.mode || "normal";
    switch (mode) {
        case "getFile":
            var fileName = obj.fileName;
            var shortName = fileName.substring(fileName.lastIndexOf('/') + 1, fileName.length);
            $("body").prepend('<a id="my_download_link" href="' + obj.fileName + '" download="' + shortName + '" style="display:none;"></a>');
            $("#my_download_link")[0].click();
            $("#my_download_link").remove();
            break;
        default :
            break;
    }*/
});

