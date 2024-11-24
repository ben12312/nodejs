var mysql = require('mysql');

var con = mysql.createConnection({
    database: 'nutech',
    host: 'localhost',
    user: 'root',
    password: 'asdasd',
})

module.exports = con;