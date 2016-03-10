$(document).ready(function(){
    var partsWrapper = $('#edit-event-parts-wrapper');
    var tabHeaderWrapper = $('#edit-event-part-tab-nav-wrapper');
    var tabContentWrapper = $('#edit-event-part-tab-content-wrapper');
    var addBtn = $('#add-event-part');



    var navTpl = '<li role="edit-event-part" class="{{activeClass}}">'+
                 '<a href="#{{key}}" aria-controls="{{key}}" role="tab" data-toggle="tab">{{title}}</a>'+
                 '</li>';

    var conTpl = '<div role="tabpanel" class="tab-pane {{activeClass}}" id="{{key}}">{{{content}}}</div>';

    var eventPartEditor = {
        data: undefined,
        template: '',
        render: function(){

            tabHeaderWrapper.html('');
            tabContentWrapper.html('');

            for(var i in eventPartEditor.data){
                var part = eventPartEditor.data[i];
                tabHeaderWrapper.append(Mustache.to_html(navTpl, part));
                part.content = Mustache.to_html(eventPartEditor.template, part);
                tabContentWrapper.append(Mustache.to_html(conTpl, part));
            }
            eventPartEditor.initPlugins();
            eventPartEditor.setHandlers();
        },
        getData: function(cb){
            var incPartsObj = [
                {
                    title: 'Новый этап',
                    activeClass: 'active',
                    key: 'new_part',
                    quest: '-',
                    order_format: '-1',
                    desc: '',
                    status: '-1',
                    start_date: '-',
                    end_date: ''
                }
            ];
            eventPartEditor.data = incPartsObj;
            if(typeof cb == 'function'){
                cb();
            }
        },
        getTemplate: function(cb){
            CF.getTemplate('edit_event_part', function(res){
                eventPartEditor.template = res;
                if(typeof cb == 'function'){
                    cb();
                }
            });

        },
        initPlugins: function(){
            partsWrapper.find('select').each(function(idx, elem){
                $(elem).select2();
                $(elem).select2('val', $(elem).data('value'));
            });
            partsWrapper.find('.fc_datepicker').each(function(idx, elem){
                $(elem).datepicker({
                    format: "dd.mm.yyyy",
                    todayBtn: "linked",
                    language: "ru",
                    autoclose: true
                }).datepicker('setDate', $(elem).val());
            });
            partsWrapper.find('.cf_text_editor').each(function(idx, elem){
                var ee = CKEDITOR.replace(elem);
                $(elem).attr('data-cke-id', ee.id);
                ee.setData($(elem).attr('value'));
            });
            partsWrapper.find('.fn-train-overflow').each(function(idx, elem){
                var train = $(elem).fn_train();
                var to_ress = $(elem).parents('.e-event-part-wrapper').eq(0).find('.to_results');
                var back_ress = $(elem).parents('.e-event-part-wrapper').eq(0).find('.back_results');

//                console.log(train, to_ress, back_ress);

                to_ress.off('click').on('click', function(){
                    console.log(train);
                    train.slideLeft();
                });
                back_ress.off('click').on('click', function(){
                    train.slideRight();
                });
            });
        },
        deactivateTabs: function () {
            for(var i in eventPartEditor.data){
                var item = eventPartEditor.data[i];
                item.activeClass = '';
            }
        },
        setHandlers: function(){
            var saves = partsWrapper.find('.save-edit-event-part');
            var showResults = partsWrapper.find('.to_results');
            saves.off('click').on('click', function(){
                var tab = $(this).parents('.tab-pane').eq(0);
                var idx = tab.index();
                var desc_id = tab.find('.fc_control[data-column="desc"]').data('cke-id');
                var editorInst = undefined;
                for(var i in CKEDITOR.instances){
                    var inst = CKEDITOR.instances[i];
                    if(inst.id == desc_id){
                        editorInst = inst;
                    }
                }
                var obj = {
                    title: tab.find('.fc_control[data-column="title"]').val(),
                    activeClass: 'active',
                    key: 'event-part-'+CF.guid(),
                    quest: tab.find('.fc_control[data-column="quest"]').val(),
                    order_format: tab.find('.fc_control[data-column="order_format"]').select2('data').id,
                    desc: editorInst.getData(),
                    start_date: tab.find('.fc_control[data-column="start_date"]').val(),
                    status: tab.find('.fc_control[data-column="status"]').select2('data').id,
                    end_date: tab.find('.fc_control[data-column="end_date"]').val()
                };

                eventPartEditor.deactivateTabs();
                eventPartEditor.data.splice(idx, 1 , obj);
                eventPartEditor.render();
            });
        }

    };

    addBtn.off('click').on('click', function(){
        eventPartEditor.data.push({
            title: 'Новый этап',
            activeClass: '',
            key: CF.guid(),
            quest: '-',
            order_format: '-1',
            desc: '',
            status: '-1',
            start_date: '-',
            end_date: '-'
        });
        eventPartEditor.render();
        tabHeaderWrapper.find('li:last-child a').click();
    });


    eventPartEditor.getData(function(){
        eventPartEditor.getTemplate(function(){
            eventPartEditor.render();
        });
    });


});