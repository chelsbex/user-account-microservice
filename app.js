var express = require('express');
var db = require('./database/dbcon.js');
var bodyParser = require('body-parser');
var app = express();
var crypto = require('crypto');
var assert = require('assert');
app.set('port', 7000);      // It is recommended that you select a random port
app.use(express.json());
app.use(bodyParser.json());
const iv = crypto.randomBytes(16);
const key = crypto.randomBytes(32);

app.post('/new-user', function(req, res){
    let data = req.body;
    let query1 = `INSERT INTO Users (username) VALUES ('${data.username}');`
    let query2 = `SELECT max(user_id) AS user_id FROM Users`
    db.pool.query(query1, function(error, rows, fields){
        if(error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            db.pool.query(query2, function(error, rows, fields){
                if(error) {
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    let user_id = rows[0];
                    const password = data.password;
                    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
                    var encrypted = cipher.update(password, 'utf-8', 'hex') + cipher.final('hex');
                    query3 = `INSERT INTO Passwords (password_id, password) VALUES ('${user_id}', '${encrypted}');`
                    db.pool.query(query3, function(error, rows, fields){
                        if(error) {
                            console.log(error);
                            res.sendStatus(400);
                        } else {
                            res.send(user_id);
                        }
                    });
                }        
            });
        }    
    });
});

app.post('/login', function(req,res){
    let data = req.body;
    let query1 = `SELECT user_id FROM Users WHERE username = '${data.username}';`
    db.pool.query(query1, function(error, rows, fields){
        if(error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            let data = rows[0];
            let query2 = `SELECT password FROM Passwords WHERE password_id = '${user_id}');`
            db.pool.query(query2, function(error, rows, fields){
                if(error) {
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    const encrypted = rows[0].password;
                    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
                    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
                    try {
                        assert.equal(decrypted, data.password);
                        res.send(data);
                    } catch(error) {
                        data.user_id = -1;
                        res.send(data);
                    }
                }
            });        
        }
    });
});  

app.use(function(req,res){
    res.status(404);
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
});

app.listen(app.get('port'), function(){
    console.log('Express started on http://flip1.engr.oregonstate.edu:' + app.get('port') + '; press Ctrl-C to terminate.');
});
