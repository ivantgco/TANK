$(document).ready(function(){

    var form_wrapper = $('#edit-article');
    var confirm_edit_article = $('#confirm_edit_article');
    var publicate = $('#publicate_article');
    var deleteArticle = $('#delete_article');

    deleteArticle.off('click').on('click', function(){
        sendQuery({
            command: 'remove',
            object: 'article',
            params: {
                id: form_wrapper.data('id')
            }
        }, function(res){
            toastr[res.toastr.type](res.toastr.message);
        });
    });

    publicate.off('click').on('click', function(){
        sendQuery({
            command: 'modify',
            object: 'article',
            params: {
                id: form_wrapper.data('id'),
                published: true
            }
        }, function(res){
            toastr[res.toastr.type](res.toastr.message);
        });
    });

    confirm_edit_article.off('click').on('click', function(){
        var params = {};
        var id = form_wrapper.data('id');
        for(var i = 0; i< form_wrapper.find('.fc-field').length; i++){
            var fld = form_wrapper.find('.fc-field').eq(i);
            var name = fld.data('server_name');
            var val = fld.val();
            if(fld.hasClass('cf_text_editor')){
                val = CKEDITOR.instances[id + '-' + name].getData();
            }
            params[name] = val;
        }
        var o = {};

        if(id == 'new'){
            o = {
                command: 'add',
                object: 'article',
                params: params
            };
        }else{
            o = {
                command: 'modify',
                object: 'article',
                params: params
            };
            o.params.id = id;
        }

        sendQuery(o, function(res){
            toastr[res.toastr.type](res.toastr.message);
        });

    });
});
