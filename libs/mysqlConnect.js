
var config = require('../config');


var mysql = require("mysql"),
    cMysql = mysql.createPool(config.get('mysqlConnection'));

var mysqlUtilities = require('mysql-utilities');
var mysqlUtilitiesExtendedWhere = require('./mysqlUtiltiesExtendedWhere');
cMysql.on('connection', function(connection) {
    console.log('MySQL pool connected');
    mysqlUtilities.upgrade(connection);
    //mysqlUtilitiesExtendedWhere.upgradeWhere(connection);
    mysqlUtilities.introspection(connection);
});
cMysql.on('error', function(err) {
    console.log('MySQL ERROR --------');
    console.log(err);
});
cMysql.on('enqueue', function () {
    console.log('Waiting for available connection slot');
});

cMysql.getConn = function(callback){
    cMysql.getConnection(function(err,conn) {
        if (err) {
            console.log(err);
            callback(err)
        } else {
            callback(null,conn);
        }
    });
};

module.exports = cMysql;


/*pool.getConnection(function(err,conn){
    if(err){
        console.log("MYSQL: can't get connection from pool:",err)
    }else {
        conn.insert('countries',{
            title:'TEST',
            external_id: 1
        },function(err,recordId){
            if (err){
                console.log(err);
            }
            console.log('Inserted:',recordId);
            conn.release();
        });

    }
});*/
//bind-address=0.0.0.0
//sudo service mysql restart
// mysql -u root -p
// create database cfft
// GRANT ALL PRIVILEGES ON cfft.* TO root@'%' IDENTIFIED BY 'aambfi5y' WITH GRANT OPTION;
//

