(function () {
	MB = MB || {};
	MB.Core = MB.Core || {};
	MB.Core.Menu = {};
//    MB.Core.Menu.populateMenu = function(){
//        var o = {
//            command: "get",
//            object: "menu_for_user",
//            sid: MB.User.sid
//        };
//        socketQuery(o,function(res){
//            res = JSON.parse(res);
//            var html = '';
//            var tpl =   '{{#menuItems}}<li class="{{isStart}} {{isActive}}">' +
//                            '<a href="#">' +
//                                '<i class="fa {{icon}}"></i>' +
//                                '<span class="title">{{title}}</span>' +
//                            '</a>' +
//                            '{{#isSubMenu}}' +
//                                '<ul class="sub-menu">' +
//                                '{{#subMenu}}' +
//                                    '<li></li>' +
//                                '{{/subMenu}}' +
//                                '</ul>'+
//                            '{{/isSubMenu}}' +
//                        '</li>{{/menuItems}}';
//
//
//            var obj = {
//                menuItems : [
//                    {
//                        isStart: 'start',
//                        isActive: 'active',
//                        icon: 'fa-times',
//                        title: 'Олололо',
//                        isSubMenu: true,
//                        subMenu: [
//
//                        ]
//                    }
//                ]
//            };
//
//            MB.Core.Menu.data = jsonToObj(res['results'][0]);
//            console.log(MB.Core.Menu.data);
//
//            var mObj = {
//                menuItems: []
//            };
//
//            function rec(obj){
//                for(var i in obj){
//                    var item = MB.Core.Menu.data[i];
//                    var tmpObj = {
//
//                    };
//
//
//                    mObj.menuItems.push();
//                }
//            }
//            rec(MB.Core.Menu.data);
//
//
//        });
//    };

	//MB.Core.Menu.populateMenu();

})();

(function () {
	MB.Core.Menu = {};
	MB.Core.Menu.createMenu = function () {

		$(document).ready(function(){
			return socketQuery({
				command: "get_menu_tree",
				object: "menu"
			}, function (response) {
				if (!response) {
	//				console.log('Необходима авторизация');
					return;
				}

				var MENU, countMENU, counter, html, j, k, l, mainMenuObj, menuItemObj, subMenu, subMenuObj, subMenuParents, subMenuRu;
				mainMenuObj = {};
				menuItemObj = {};
				subMenuObj = {};
				html = "";
				for (var i in response.data) {
					var mItem = response.data[i];

					if (mItem["menu_type"] === "main_menu") {

						mainMenuObj[mItem["menu_item"]] = {
							name: mItem["name"],
							menu_type: mItem["menu_type"],
							items: {},
							icon: mItem["icon"]
						};


					} else if (mItem["menu_type"] === "item" || mItem["menu_type"] === "report" || mItem["menu_type"] === "content" || mItem["menu_type"] === "modalmini") {

						if (menuItemObj.hasOwnProperty(mItem["menu_item"])) {
							menuItemObj[mItem["menu_item"]]["parent_menu"].push(mItem["parent_menu"]);
						} else {
							menuItemObj[mItem["menu_item"]] = {
								name: mItem["name"],
								menu_type: mItem["menu_type"],
								parent_menu: [mItem["parent_menu"]],
								client_object: mItem["client_object"],
								class_name: mItem["class_name"]

							};
						}
					} else if (mItem["menu_type"] === "sub_menu") {
						if (subMenuObj.hasOwnProperty(mItem["menu_item"])) {
							subMenuObj[mItem["menu_item"]]["parent_menu"].push(mItem["parent_menu"]);
						} else {
							subMenuObj[mItem["menu_item"]] = {
								name: mItem["name"],
								menu_type: mItem["menu_type"],
								parent_menu: [mItem["parent_menu"]]
							};
						}
					}
				}
				MENU = mainMenuObj;
				for (i in subMenuObj) {
					subMenu = i;
					subMenuRu = subMenuObj[subMenu]["name"];
					subMenuParents = subMenuObj[subMenu]["parent_menu"];
					j = subMenuParents.length - 1;
					while (j >= 0) {
						MENU[subMenuParents[j]]["items"][subMenu] = {
							name: subMenuRu,
							items: {}
						};
						j--;
					}
				}
				for (i in menuItemObj) {
					j = 0;
					while (j < menuItemObj[i]["parent_menu"].length) {
						for (k in MENU) {
							if (menuItemObj[i]["parent_menu"].indexOf(k) === -1) {
								for (l in MENU[k]["items"]) {
									if (typeof MENU[k]["items"][l] === "object") {
										if (menuItemObj[i]["parent_menu"].indexOf(l) !== -1) {
											MENU[k]["items"][l]["items"][i] = {
												name: menuItemObj[i]["name"],
												client_object: menuItemObj[i]["client_object"],
												class_name: menuItemObj[i]["class_name"],
												menu_type: menuItemObj[i]["menu_type"]
											};
										}
									}
								}
							} else {
								MENU[k]["items"][i] = {
									name: menuItemObj[i]["name"],
									client_object: menuItemObj[i]["client_object"],
									class_name: menuItemObj[i]["class_name"],
									menu_type: menuItemObj[i]["menu_type"]
								};
							}
						}
						j++;
					}
				}
				MB.Core.Menu.menuObj = MENU;
				counter = 0;
				countMENU = Object.keys(MENU);
				// countMENU = MB.Core.Menu.countObj(MENU);

				for (i in MENU) {
					if (counter === 0) {
						html += "<li class='start active open'>\n"; //active
					} else if (counter === countMENU) {
						html += "<li class='last'>\n";
					} else {
						html += "<li>\n";
					}
					html += "\t<a href='#'>\n";
					html += "\t\t<i class='fa fa-" + MENU[i]["icon"] + "'></i>\n";
					html += "\t\t<span class='title'>" + MENU[i]["name"] + "</span>\n";
					html += "\t</a>\n";
					html += "\t<ul class='sub-menu'>\n";
					for (j in MENU[i]["items"]) {
						if (MENU[i]["items"][j].hasOwnProperty("client_object")) {
							if (MENU[i]["items"][j]["client_object"] && typeof MENU[i]["items"][j]["client_object"] === "string") {
								html += "\t\t<li id='" + j + "' data-class='"+ MENU[i]["items"][j]["class_name"] +"' data-contenttype='"+ MENU[i]["items"][j]["content_type"] +"' data-objectname='" + MENU[i]["items"][j]["client_object"] + "' data-type='" + MENU[i]["items"][j]["menu_type"] + "' class='menu-item'><a href='#' onclick='return false;'><i class='fa fa-shopping-cart'></i>" + MENU[i]["items"][j]["name"] + "</a></li>\n";
							} else {
								html += "\t\t<li id='" + j + "' data-class='"+ MENU[i]["items"][j]["class_name"] +"' data-contenttype='"+ MENU[i]["items"][j]["content_type"] +"' data-type='" + MENU[i]["items"][j]["menu_type"] + "' class='menu-item'><a href='#' onclick='return false;'><i class='fa fa-shopping-cart'></i>" + MENU[i]["items"][j]["name"] + "</a></li>\n";
							}
						} else if (MENU[i]["items"][j].hasOwnProperty("items")) {
							html += "\t\t<li>\n";
							html += "\t\t\t<a href='#' onclick='return false;'>" + MENU[i]["items"][j]["name"] + "<span class='arrow'></span></a>\n";
							html += "\t\t\t<ul class='sub-menu'>\n";
							for (k in MENU[i]["items"][j]["items"]) {
								if (MENU[i]["items"][j]["items"][k]["client_object"] && typeof MENU[i]["items"][j]["items"][k]["client_object"] === "string") {
									html += "\t\t<li id='" + k + "' data-class='"+ MENU[i]["items"][j]["items"][k]["class_name"] +"' data-objectname='" + MENU[i]["items"][j]["items"][k]["client_object"] + "' data-type='" + MENU[i]["items"][j]["items"][k]["menu_type"] + "' class='menu-item'><a href='#' onclick='return false;'><i class='fa fa-shopping-cart'></i>" + MENU[i]["items"][j]["items"][k]["name"] + "</a></li>\n";
								} else {
									html += "\t\t<li id='" + k + "' class='menu-item'><a href='#' onclick='return false;'><i class='fa fa-shopping-cart'></i>" + MENU[i]["items"][j]["items"][k]["name"] + "</a></li>\n";
								}
							}
							html += "\t\t\t</ul>\n";
							html += "\t\t</li>\n";
						}else{


							html += "\t\t<li id='" + j + "' data-class='"+ MENU[i]["items"][j]["class_name"] +"' data-objectname='" + MENU[i]["items"][j]["client_object"] + "' data-type='" + MENU[i]["items"][j]["menu_type"] + "' class='menu-item'><a href='#' onclick='return false;'><i class='fa fa-shopping-cart'></i>" + MENU[i]["items"][j]["name"] + "</a></li>\n";
						}
					}
					html += "\t</ul>\n";
					html += "</li>\n";
					counter++;
				}
				$("#mainMenu").append(html);


				return $("#mainMenu").on("click", ".menu-item", function () {
					var menuType, objectname, liId;
					$(document).scrollTop(0);
					objectname = $(this).data("objectname");
					menuType = $(this).data("type");
					liId = $(this).attr('id');
					var menu_class = $(this).data("class");

					if (!menuType) return;

					if (menuType === "content") {
						if (liId == 'menu_afisha') {
							MB.Core.afisha.init();
							return;
						}

						return MB.Core.switchPage({
							isNew: true,
							type: menuType,
							filename: liId
						});
					} else if (menuType === "item") {
						MB.Core.spinner.start($('.page-content-wrapper'));
						return MB.Core.switchPage({
							type: menuType,
							name: objectname,
							client_object: objectname,
							class: menu_class,
							isNewTable: true
						});
					} else if (menuType === "modalmini") {
						if (liId == 'menu_generate_repertuar') {
							return MB.Core.switchPage({
								isNew: true,
								type: menuType,
								name: objectname
							});
						} else {
							return MB.Core.switchPage({
								type: menuType,
								name: objectname
							});
						}

					} else if (menuType === "report") {
						return MB.Core.switchPage({
							type: menuType,
							name: objectname
						});
					}
					return false;
				});
			});
		});
	};

	MB.Core.Menu.createMenu();

    //$('#userBlock').off('click').on('click', function () {
    //    socketQuery({
    //        command: '_CLEAR',
    //        object: 'cleatr'
    //    }, function(){});
    //});

}).call(this);
