var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs361_[your_osu_username]',
  password        : '[last_4_of_studentID]',  // or your password if you have changed it
  database        : 'cs361_[your_osu_username]'
});

module.exports.pool = pool;