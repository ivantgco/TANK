(function(){

    CF = CF || {};

    CF.directories = {
        columnNames: {
            action_id: 'ID Мероприятия',
            action_part: "Этап",
            action_part_id: "ID Этапа мероприятия",
            action_title: "Мероприятие",
            concat_result: "Результат",
            created: "Дата создания",
            deleted: "Удален",
            id: "ID",
            isAff: "Сдан в аффилиате",
            judge_result_approach: "Судья: Подходы",
            judge_result_min: "Судья: минут",
            judge_result_repeat: "Судья: Повторы",
            judge_result_sec: "Судья: Секунды",
            published: "Опубликовано",
            result_approach: "Подходы",
            result_min: "Минут",
            result_repeat: "Повторы",
            result_sec: "Секунды",
            result_type: "Тип результата",
            result_type_id: "ID Типа результата",
            status_id: "ID Статуса",
            status_name: "Статус",
            status_name_sys: "Статус SYS",
            user_firstname: "Имя",
            user_id: "ID Пользователя",
            user_surname: "Фамилия",
            video_url: "Ссылка на видео",
            title: "Наименование",
            name: "Наименование",
            regulations: "Регламент",
            club: "Клуб"
        }
    };

    CF.Tables = function(){
        this.items = [];
    };

    CF.Tables.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return id;
            }
        }
    };

    CF.Tables.prototype.addItem = function(item){
        this.items.push(item);
    };

    CF.Tables.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    CF.TablesList = new CF.Tables();

    CF.Table = function(p){
        this.id =               p.id || CF.guid();
        this.wrapper =          p.wrapper || undefined;
        this.where =            p.where || {};
        this.defaultWhere =     p.defaultWhere || {};
        this.getObject =        p.getObject || undefined;
        this.limit =            p.limit || 20;
        this.perPage =          p.perPage || 20;
        this.sort =             p.sort || '';
        this.columns =          p.columns || '';
        this.visible_columns =  p.visible_columns || [];
        this.goToObject =       p.goToObject || '';
        this.primaryKey =       p.primaryKey || undefined;
        this.filters =          p.filters || [];
        this.tempPage =         1;
        this.specialColumns =   p.specialColumns || [];
        this.isLeaderBoard =    p.isLeaderBoard || false;
        this.isAllLeaderBoard = p.isAllLeaderBoard || '';
        this.gender_sys_name =  p.gender_sys_name || '';
        this.age =              p.age || '';
        this.action_id =        p.action_id || '';
        this.type =             p.type || '';
    };

    CF.Table.prototype.init = function(){
        var _t = this;
        _t.getData(function(){
            _t.render(function(){
                _t.setHandlers();
                _t.renderFilters();
                _t.initFilters();
            });

            CF.TablesList.addItem(_t);
        });
    };

    CF.Table.prototype.getData = function(cb){
        var _t = this;

        if(_t.isAllLeaderBoard){
            var o = {
                command: 'allActionLeaderBoard',
                object: 'results',
                params: {
                    gender_sys_name: _t.gender_sys_name,
                    age: _t.age,
                    action_id: _t.action_id,
                    where: _t.where,
                    limit: 5,
                    sort: _t.sort,
                    columns: _t.columns
                }
            };

            sendQuery(o, function(res){
                _t.totalCount = res.totalCount;
                _t.data = res.data;
                _t.columns = res.columns;

                console.log('КОЛОНКИ' , _t.data);

                if(typeof cb == 'function'){
                    cb();
                }
                return;
            });

            //if(typeof cb == 'function'){
            //    cb();
            //}

            return;
        }

        if(_t.isLeaderBoard){

            var o = {
                command: 'actionLeaderBoard',
                object: 'results',
                params: {
                    gender_sys_name: _t.gender_sys_name,
                    age: _t.age,
                    action_id: _t.action_id,
                    where: _t.where,
                    limit: _t.limit,
                    sort: _t.sort,
                    columns: _t.columns
                }
            };

            sendQuery(o, function(res){
                _t.totalCount = res.totalCount;
                _t.data = res.data;
                _t.columns = res.columns;
                if(typeof cb == 'function'){
                    cb();
                }
                return;
            });

            if(typeof cb == 'function'){
                cb();
            }
            return;
        }

        var o = {
            command: 'get',
            object: _t.getObject,
            params: {
                where: _t.where,
                limit: _t.limit,
                sort: _t.sort,
                columns: _t.columns
            }
        };

        sendQuery(o, function(res){
            if(_t.isLeaderBoard || _t.isAllLeaderBoard){
                if(res.code == -10){
                    _t.totalCount = res.totalCount;
                    _t.data = res.data;
                    _t.columns = res.columns;
                }else if(res.code == 0){
                    _t.totalCount = res.totalCount;
                    _t.data = res.data;
                    _t.columns = res.columns;
                }

            }else{
                _t.totalCount = res.totalCount;
                _t.data = res.data;
            }

            if(typeof cb == 'function'){
                cb();
            }
        });

    };

    CF.Table.prototype.getColumnName = function(column){
        return CF.directories.columnNames[column];
    };

    CF.Table.prototype.checkSpecial = function(column){
        var _t = this;

        for(var i in _t.specialColumns){
            var c = _t.specialColumns[i];
            if(c.column == column){
                return true;
            }
        }
        return false;
        //return _t.specialColumns.indexOf(column) >= 0;
    };

    CF.Table.prototype.checkVisibility = function(column){
        var _t = this;
        return _t.visible_columns.indexOf(column) >= 0;
    };

    CF.Table.prototype.getPrimaryKey = function(row){
        var _t = this;
        var pk = _t.primaryKey;
        for(var i in row){
            if(i == pk){
                return row[i];
            }
        }
    };

    CF.Table.prototype.renderFilters = function(){
        var _t = this;
        _t.wrapper.find('.filterContainer').remove();
        if(_t.filters.length == 0){
            return;
        }
        if(_t.type == 'part_table'){
            var html = '<div class="part-filters-wrapper filters-wrapper"></div><div class=""><div class="confirm-filter filterBtn fa fa-check"></div><div class="clear-filter filterBtn fa fa-ban"></div></div>';
            //_t.wrapper.prev().html(html);
            _t.wrapper.find('.part-filters-parent .filters-list').prepend(html);
        }else{
            var html = '<div class="filterContainer"><div class="row"><div class="filters-wrapper row"></div><div class=""><div class="confirm-filter filterBtn fa fa-check"></div><div class="clear-filter filterBtn fa fa-ban"></div></div></div></div>';
            _t.wrapper.prepend(html);
        }


    };

    CF.Table.prototype.render = function(cb){
        var _t = this;
        if(_t.type == 'part_table'){
            _t.renderPartTable();
            if(typeof cb == 'function'){
                cb();
            }
            return;
        }

        if(_t.isAllLeaderBoard){
            _t.renderAllLeaderBoard();
            if(typeof cb == 'function'){
                cb();
            }
            return;
        }

        if(_t.isLeaderBoard){
            _t.renderLeaderBoard();
            if(typeof cb == 'function'){
                cb();
            }
            return;
        }

        var prev = (_t.tempPage > 1)? '<li><a href="#" aria-label="Previous" class="prev"><span aria-hidden="true">&laquo;</span></a></li>' : '';
        var next = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" aria-label="Next" class="next"><span aria-hidden="true">&raquo;</span></a></li>' : '';
        var page = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" data-page="{{pageNo}}" class="page">{{pageNo}}</a></li>' : '';

        var tpl = '<div class="refresh_table fa fa-refresh"></div><table class="table simpleView">' +
                    '<thead>' +
                    '<tr>{{#columns}}' +
                    '<th data-column="{{column}}">{{column_ru}}</th>{{/columns}}' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>{{#rows}}' +
                    '<tr data-id="{{id}}">{{#tds}}' +
                    '<td>{{{value}}}</td>{{/tds}}' +
                    '</tr>{{/rows}}' +
                    '</tbody>' +
                    '</table>' +
                    '<nav>'+
                        '<ul class="pagination">'+
                            prev+
                            '{{#pages}}'+
                                page +
                            '{{/pages}}'+
                            next+
                        '</ul>'+
                    '</nav>';

        var mO = {
            columns: [
                {
                    column: '#',
                    column_ru: '#'
                }
            ],
            rows: [],
            pages: [
                {
                    pageNo: _t.tempPage
                }
            ]
        };
        for(var i in _t.data[0]){
            var item = _t.data[0][i];
            if(_t.checkVisibility(i)){
                mO.columns.push({
                    column: i,
                    column_ru: _t.getColumnName(i)
                });
            }
        }

        var idx = 0;
        for(var k in _t.data){
            var item = _t.data[k];
            mO.rows.push({
                tds: [
                    {
                        value: idx+1
                    }
                ]
            });

            for(var j in item){
                var jtem = item[j];
                if(_t.checkVisibility(j)) {
                    if(_t.checkSpecial(j)){
                        mO.rows[idx].id = _t.getPrimaryKey(item);
                        mO.rows[idx].tds.push({
                            value: '<a target="_blank" href="'+jtem+'"><i class="fa fa-video-camera"></i></a>'
                        });
                    }else{
                        mO.rows[idx].id = _t.getPrimaryKey(item);
                        mO.rows[idx].tds.push({
                            value: jtem
                        });
                    }
                }
            }

            idx++;
        }
        _t.wrapper.find('table.table.simpleView').remove();
        _t.wrapper.find('nav').remove();
        _t.wrapper.find('.no_results').remove();
        _t.wrapper.append(Mustache.to_html(tpl, mO));

        if(_t.data.length == 0){
            _t.wrapper.append('<div class="no_results">Результатов нет, пока.</div>');
        }
        if(typeof cb == 'function'){
            cb();
        }
    };

    CF.Table.prototype.renderAllLeaderBoard = function(){
        var _t = this;
        //var tpl = '<div class="refresh_table fa fa-refresh"></div><table class="table simpleView leaderBoardTable">' +
        //    '<thead>' +
        //    '<tr>{{#columns}}' +
        //    '<th data-column="{{name}}">{{title}}</th>{{/columns}}' +
        //    '</tr>' +
        //    '</thead>' +
        //    '<tbody>' +
        //    '{{#rows}}' +
        //    '<tr data-id="{{id}}">' +
        //    '{{#tds}}' +
        //    '<td>{{value}}</td>' +
        //    '{{/tds}}' +
        //    '</tr>' +
        //    '{{/rows}}' +
        //    '</tbody>' +
        //    '</table>' ;

        var tpl = '<div class="allLB-wrapper">' +
                    '<div class="allLB-list">' +
                        '{{#leaders}}' +
                            '<div class="row allLB-item">' +
                                '<div class="col-md-1 col-xs-1">' +
                                    '<div class="allLB-user-pos-wrapper">' +
                                        '{{position}}' +
                                    '</div>' +
                                '</div>' +
                                '<div class="col-md-9 col-xs-9">' +
                                    '<div class="allLB-user-img-wrapper" style="background-image: url(upload/{{photo}})">' +
                                        //'<img src="upload/{{photo}}" />' +
                                    '</div>' +
                                    '<div class="allLB-user-fio-wrapper">{{fio}}</div>' +
                                '</div>' +
                                '<div class="col-md-2 col-xs-2">' +
                                    '<div class="allLB-user-rat-wrapper">' +
                                        '{{raiting}}' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '{{/leaders}}' +
                    '</div>' +
                    '</div>';

        console.log(_t.columns, _t.data);

        for(var i in _t.data){
            var item = _t.data[i];
            console.log(item.photo);
            if(!item.photo || item.photo == '' || item.photo == 'null'){
                _t.data[i].photo = 'user_default_m.jpg';
            }
        }

        var mO = {
            leaders: _t.data
        };

        if(_t.data.length == 0){
            tpl = '<div class="allLB-wrapper">' +
                    '<div class="allLB-list">' +
                    '<div class="row allLB-item">' +
                    '<div class="allLB-user-noresults-wrapper">Нет лидеров в данной категории</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
        }

        _t.wrapper.html(Mustache.to_html(tpl, mO));
        //debugger;

        return;

        var rows = [];


        for(var i in _t.data){
            var it = _t.data[i];
            rows.push({
                id: i,
                tds:[]
            });
        }

        for(var i in _t.data){
            var it = _t.data[i];
            var idx = 0;
            for(var k in it){
                rows[i].tds.push({
                    value: it[k]
                });
            }
            idx++;
        }

        var mO = {
            columns: _t.columns,
            rows: rows
        };

        console.log('leaderBoard', mO);

        _t.wrapper.html(Mustache.to_html(tpl, mO));
    };

    CF.Table.prototype.renderLeaderBoard = function(){
        var _t = this;
        var tpl = '<div class="refresh_table fa fa-refresh"></div><table class="table simpleView leaderBoardTable">' +
                    '<thead>' +
                    '<tr>{{#columns}}' +
                    '<th data-column="{{name}}">{{title}}</th>{{/columns}}' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        '{{#rows}}' +
                            '<tr data-id="{{id}}">' +
                                '{{#tds}}' +
                                    '<td>{{value}}</td>' +
                                '{{/tds}}' +
                            '</tr>' +
                        '{{/rows}}' +
                    '</tbody>' +
                    '</table>' ;

        var rows = [];

        console.log('LEADERBOARD', _t.data);

        for(var i in _t.data){
            var it = _t.data[i];
            rows.push({
                id: i,
                tds:[]
            });
        }

        for(var i in _t.data){
            var it = _t.data[i];
            var idx = 0;
            for(var k in it){
                rows[i].tds.push({
                    value: it[k]
                });
            }
            idx++;
        }


        var mO = {
            columns: _t.columns,
            rows: rows
        };

        console.log('leaderBoard', mO);

        _t.wrapper.html(Mustache.to_html(tpl, mO));
    };

    CF.Table.prototype.reload = function(){
        var _t = this;

        _t.getData(function() {
            var prev = (_t.tempPage > 1)? '<li><a href="#" aria-label="Previous" class="prev"><span aria-hidden="true">&laquo;</span></a></li>' : '';
            var next = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" aria-label="Next" class="next"><span aria-hidden="true">&raquo;</span></a></li>' : '';
            var page = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" data-page="{{pageNo}}" class="page">{{pageNo}}</a></li>' : '';
            var tpl = '<div class="col-md-8 part-table-parent">' +
                            '<table class="table simpleView">' + //<div class="refresh_table fa fa-refresh"></div>
                            '<thead>' +
                            '<tr>{{#columns}}' +
                            '<th data-column="{{column}}">{{column_ru}}</th>{{/columns}}' +
                            '</tr>' +
                            '</thead>' +
                            '<tbody>{{#rows}}' +
                            '<tr data-id="{{id}}">{{#tds}}' +
                            '<td>{{{value}}}</td>{{/tds}}' +
                            '</tr>{{/rows}}' +
                            '</tbody>' +
                            '</table>' +
                            '<nav>'+
                            '<ul class="pagination">'+
                            prev+
                            '{{#pages}}'+
                            page +
                            '{{/pages}}'+
                            next+
                            '</ul>'+
                            '</nav>' +
                            '</div>' +
                            '</div>';
            var mO = {
                columns: [
                    {
                        column: '#',
                        column_ru: '#'
                    }
                ],
                rows: [],
                pages: [
                    {
                        pageNo: _t.tempPage
                    }
                ]
            };
            for(var i in _t.data[0]){
                var item = _t.data[0][i];
                if(_t.checkVisibility(i)){
                    mO.columns.push({
                        column: i,
                        column_ru: _t.getColumnName(i)
                    });
                }
            }

            var idx = 0;
            for(var k in _t.data){
                var item = _t.data[k];
                mO.rows.push({
                    tds: [
                        {
                            value: idx+1
                        }
                    ]
                });

                for(var j in item){
                    var jtem = item[j];
                    if(_t.checkVisibility(j)) {
                        if(_t.checkSpecial(j)){
                            mO.rows[idx].id = _t.getPrimaryKey(item);
                            mO.rows[idx].tds.push({
                                value: '<a target="_blank" href="'+jtem+'"><i class="fa fa-video-camera"></i></a>'
                            });
                        }else{
                            mO.rows[idx].id = _t.getPrimaryKey(item);
                            mO.rows[idx].tds.push({
                                value: jtem
                            });
                        }
                    }
                }

                idx++;
            }
            _t.wrapper.find('.part-table-parent').after(Mustache.to_html(tpl, mO));
            _t.wrapper.find('.part-table-parent').eq(0).remove();
        });
    };

    CF.Table.prototype.renderPartTable = function(){
        var _t = this;

        var prev = (_t.tempPage > 1)? '<li><a href="#" aria-label="Previous" class="prev"><span aria-hidden="true">&laquo;</span></a></li>' : '';
        var next = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" aria-label="Next" class="next"><span aria-hidden="true">&raquo;</span></a></li>' : '';
        var page = (_t.totalCount > _t.tempPage * _t.perPage)? '<li><a href="#" data-page="{{pageNo}}" class="page">{{pageNo}}</a></li>' : '';

        var tpl =  '<div class="part-table-template">' +
                        '<div class="col-md-4 part-filters-parent"><div class="filters_block_2"></div>' + //Фильтры временно недоступны
                            '<div class="filter-title"><div class="col-md-12">Фильтровать резутлтаты</div></div>' +
                            '<div class="filters-list">' +
                            '</div>' +
                        '</div>' +
                        '<div class="col-md-8 part-table-parent">' +
                                '<table class="table simpleView">' + //<div class="refresh_table fa fa-refresh"></div>
                                '<thead>' +
                                '<tr>{{#columns}}' +
                                '<th data-column="{{column}}">{{column_ru}}</th>{{/columns}}' +
                                '</tr>' +
                                '</thead>' +
                                '<tbody>{{#rows}}' +
                                '<tr data-id="{{id}}">{{#tds}}' +
                                '<td>{{{value}}}</td>{{/tds}}' +
                                '</tr>{{/rows}}' +
                                '</tbody>' +
                                '</table>' +
                                '<nav>'+
                                '<ul class="pagination">'+
                                prev+
                                '{{#pages}}'+
                                page +
                                '{{/pages}}'+
                                next+
                                '</ul>'+
                                '</nav>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

        var mO = {
            columns: [
                {
                    column: '#',
                    column_ru: '#'
                }
            ],
            rows: [],
            pages: [
                {
                    pageNo: _t.tempPage
                }
            ],
            filters: []
        };

        for(var i in _t.data[0]){
            var item = _t.data[0][i];
            if(_t.checkVisibility(i)){
                mO.columns.push({
                    column: i,
                    column_ru: _t.getColumnName(i)
                });
            }
        }

        var idx = 0;
        for(var k in _t.data){
            var item = _t.data[k];
            mO.rows.push({
                tds: [
                    {
                        value: idx+1
                    }
                ]
            });

            for(var j in item){
                var jtem = item[j];
                if(_t.checkVisibility(j)) {
                    if(_t.checkSpecial(j)){
                        mO.rows[idx].id = _t.getPrimaryKey(item);
                        mO.rows[idx].tds.push({
                            value: '<a target="_blank" href="'+jtem+'"><i class="fa fa-video-camera"></i></a>'
                        });
                    }else{
                        mO.rows[idx].id = _t.getPrimaryKey(item);
                        mO.rows[idx].tds.push({
                            value: jtem
                        });
                    }
                }
            }

            idx++;
        }
        _t.wrapper.find('table.table.simpleView').remove();
        _t.wrapper.find('nav').remove();
        _t.wrapper.find('.no_results').remove();

        _t.wrapper.append(Mustache.to_html(tpl, mO));
        _t.wrapper.find('.part-filters-parent').eq(1).remove();

        if(typeof cb == 'function'){
            cb();
        }
    };

    CF.Table.prototype.setHandlers = function(){
        var _t = this;
        _t.wrapper.find('tbody tr').off('click').on('click', function(){
            var id = $(this).data('id');
            if(_t.goToObject != ''){
                window.open(_t.goToObject+'?'+_t.primaryKey+'='+id , '_blank');
            }

        });

        var refresh = _t.wrapper.find('.refresh_table');
        var paginationWrapper = _t.wrapper.find('.pagination');
        var pages = paginationWrapper.find('a.page');
        var prev = paginationWrapper.find('a.prev');
        var next = paginationWrapper.find('a.next');

        next.off('click').on('click', function(){
            _t.limit = _t.tempPage*_t.perPage+','+_t.perPage;

            _t.getData(function(){
                _t.tempPage = _t.tempPage + 1;
                _t.render(function(){
                    _t.setHandlers();
                });
            });
        });
        prev.off('click').on('click', function(){
            _t.limit = (_t.tempPage -2)*_t.perPage+','+_t.perPage;

            _t.getData(function(){
                _t.tempPage = _t.tempPage - 1;
                _t.render(function(){
                    _t.setHandlers();
                });
            });

        });

        refresh.off('click').on('click', function(){
            _t.getData(function(){
                _t.render(function(){
                    _t.setHandlers();
                });
            });
        });


        if(_t.isLeaderBoard || _t.isAllLeaderBoard){
            _t.wrapper.find('th').off('click').on('click', function(){
                _t.sort = {};
                _t.sort[$(this).data('column')] = 'ASC';
                _t.getData(function(){
                    _t.render(function(){
                        _t.setHandlers();
                    });
                });
            });
        }

    };

    CF.Table.prototype.initFilters = function(){
        var _t = this;
        var filterWrapper = _t.wrapper.find('.filters-wrapper');
        for(var i in _t.filters){
            var filter = _t.filters[i];
            var html = '';
            var colClass = (_t.type == 'part_table')? 'col-md-12': 'col-md-3';
            if(filter.type == 'like'){
                html = '<div class="'+colClass+'"><label>'+filter.label+'</label><input type="text" data-where_type="'+filter.whereType+'" data-where_table="'+filter.whereTable+'" class="tableFilter form-control" data-filter_type="like" data-column="'+filter.column+'"/></div>';
            }else if(filter.type == 'select'){
                html = '<div class="'+colClass+'"><label>'+filter.label+'</label><input type="hidden" data-where_type="'+filter.whereType+'" data-where_table="'+filter.whereTable+'" data-return_id="'+filter.returnId+'" data-return_name="'+filter.returnName+'" class="tableFilter form-control select2" data-text="" data-filter_type="select" data-name="'+filter.column+'" data-server_name="'+filter.returnName+'" data-table="'+filter.tableName+'" data-column="'+filter.column+'"/></div>';
            }
            filterWrapper.append(html);
        }
        filterWrapper.find('input.select2[type="hidden"]').each(function(idx, elem){
            var $elem = $(elem);
            var name = $elem.data('server_name');
            var returnId = $elem.data('return_id');
            var returnName = $elem.data('return_name');
            var whereType = $elem.data('where_type');
            var whereTable = $elem.data('where_table');
            $elem.select2({
                query: function(query){
                    var data = {results: []};


                    var o = {
                        command: 'get',
                        object: $elem.data('table'),
                        params: {
                            limit: 100
                        }
                    };
                    if(query.term.length > 0){
                        o.params.where = {};
                        o.params.where[name] = '*'+query.term+'*';
                    }

                    sendQuery(o, function(res){
                        for(var i in res.data){
                            var item = res.data[i];
                            data.results.push({
                                id: item[returnId],
                                text: item[returnName]
                            });
                        }
                        query.callback(data);
                    });
                },
                initSelection: function(element, callback){
                    var data = {id: element.val(), text: $(element).data('text')};
                    callback(data);
                }
            });
            $elem.off('change').on('change', function(){
                if(whereType == 'external'){
                    if(!_t.where[whereTable]){
                        _t.where[whereTable] = {};
                    }
                    _t.where[whereTable][$elem.data('column')] = $elem.select2('data').id;
                }else{
                    _t.where[$elem.data('column')] = $elem.select2('data').id;
                }
            });
        });

        filterWrapper.find('input.tableFilter[type="text"][data-filter_type="like"]').off('input').on('input', function(){
            var whereType = $(this).data('where_type');
            var whereTable = $(this).data('where_table');
            if(whereType == 'external'){
                if(!_t.where[whereTable]){
                    _t.where[whereTable] = {};
                }
                _t.where[whereTable][$(this).data('column')] = '*'+$(this).val()+'*';
            }else{
                _t.where[$(this).data('column')] = '*'+$(this).val()+'*';
            }
            console.log(_t.defaultWhere);

        });

        _t.wrapper.find('.confirm-filter').off('click').on('click', function(){
            if(_t.type == 'part_table'){
                _t.reload();
            }else{
                _t.getData(function(){
                    _t.render(function(){
                        _t.setHandlers();
                    });
                });
            }

        });

        _t.wrapper.find('.clear-filter').off('click').on('click', function(){

            filterWrapper.find('input.select2[type="hidden"]').each(function(idx, elem){
                var $elem = $(elem);
                $elem.select2('val', '-1');
            });
            filterWrapper.find('input.tableFilter[type="text"][data-filter_type="like"]').val('');

            _t.where = {};
            if(_t.type == 'part_table'){
                _t.where = CF.cloneObj(_t.defaultWhere);
                _t.reload();
            }else{
                _t.where = CF.cloneObj(_t.defaultWhere);

                _t.getData(function(){
                    _t.render(function(){
                        _t.setHandlers();
                        _t.renderFilters();
                        _t.initFilters();
                    });
                });
            }

        });
    };


}());
