(function () {
    var instance = MB.O.forms["form_crm_user"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_crm_user.activeId;
        uiTabs();
        var table1 = new MB.Table({
            world: "crm_user_tickets",
            name: "tbl_crm_ticket",
            params: {
                parent: instance
                // parentkeyvalue: id,
                // parentobject: "form_role",
                // parentobjecttype: "form"
            }
        });
        table1.create(function () {});

        var table2 = new MB.Table({
            world: "crm_user_orders",
            name: "tbl_crm_order",
            params: {
                parent: instance
                // parentkeyvalue: id,
                // parentobject: "form_role",
                // parentobjecttype: "form"
            }
        });
        table2.create(function () {});

        $(document).ready(function(){
            $('.forInForm').eq(0).on('click', function(){
                table1.reload('data');
            });

            $('.forInForm').eq(1).on('click', function(){
                table2.reload('data');
            });
        });

       callback();
    };


})();
