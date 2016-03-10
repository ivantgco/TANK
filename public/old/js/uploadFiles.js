var FileLoader = function(params){
    this.loaded = true;
    if (!params.delivery){
        console.log("В ImageLoader не передается параметр delivery");
        this.loaded = false;
        return false;
    }
    this.delivery = params.delivery;
    this.filelist = [];
    this.counter = 0;
    this.container = $("body");

    this.dir = params.dir || "upload/";
    this.name = params.name || "ForUploadFile";
    var counter = 0;
    while(this.container.find("#input"+this.name+counter).length!==0){
        counter++;
    }
    this.container.append('<input type="file" style="display: none;" multiple="true"  id="input'+this.name+counter+'">');
    this.container.append('<input type="submit" style="display: none;" id="submit'+this.name+counter+'">');
    this.input = this.container.find("#input"+this.name+counter);
    this.submit = this.container.find("#submit"+this.name+counter);
    if (typeof params.success==="function") this.success = params.success;
    if (typeof params.error==="function") this.success = params.error;
    var self = this;
    this.submit.on("click",function(evt){
        // TODO после массового выделения файлов не срабатывает событие
        for (var i in self.input[0].files) {
            if (isNaN(+i)){
                continue;
            }
            self.filelist.push(self.input[0].files[i]);
        }
        self.send();

        /*var file = self.filelist[0];
        delete self.filelist[0];
        self.delivery.send(file);
        self.counter++;*/
        evt.preventDefault();
    });
    this.uid = '';
    this.delivery.on('send.success',function(fileUID){
        if (self.id===fileUID.uid){
            return;
        }
        self.uid = fileUID.uid;
        self.success(fileUID);
        self.send();
       /* if (!!self.filelist[self.counter]){
            self.send();
        }else{
            //self.counter = 0;
        }*/
        //console.log(fileUID);

    });
    this.delivery.on('send.error',function(error){
            self.error(error);
    });
    this.input.on("change",function(){
        self.submit.click();
    });
};
FileLoader.prototype = {
    send:function(){
        if (!this.filelist[0]){
            return;
        }
        var file = this.filelist.shift();
        file.name = decodeURI(file.name);
        this.delivery.send(file);
        this.counter++;
    },
    success:function(fileUID){
        console.log(fileUID);
    },
    error:function(error){
        console.log("Загрузка файла не удалась:");
        console.log(error);

    },
    start:function(params){
        if (!this.loaded) return;
        if (typeof params==="object"){
            if (typeof params.success==="function") this.success = params.success;
            if (typeof params.error==="function") this.success = params.error;
            if (typeof params.dir==="function") this.dir = params.dir;
        }
        this.input.click();
    }

};



