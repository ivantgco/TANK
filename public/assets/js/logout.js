function logout () {

    var o = {
        command: 'logout',
        object: 'User'
    };

    socketQuery(o, function(res){
        document.location.href = "login.html";
    });

}