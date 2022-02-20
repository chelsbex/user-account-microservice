var express = require('express');
var db = require('./database/dbcon.js');
var bodyParser = require('body-parser');
var app = express();
var crypto = require('crypto');
var assert = require('assert');
app.set('port', 7000);                      // It is recommended that you select a random port
app.use(express.json());
app.use(bodyParser.json());
const iv = crypto.randomBytes(16);          // Initialized when run; rerunning will create a new initialization vector and old cipher will be lost
const key = crypto.randomBytes(32);         // Initialized when run; rerunning will create a new key and old cipher will be lost

/*
Request handler for creating a new user
Takes an object containing username and password attributes: {username:[entered username], password:[entered password]}
Inserts username into Users table and password into Passwords table (following encryption) of connected database
Returns in response object the user_id of the created user within the 'user_id' attribute
*/
app.post('/new-user', function(req, res){
    let data = req.body;
    let query1 = `INSERT INTO Users (username) VALUES ('${data.username}');`
    let query2 = `SELECT max(user_id) AS user_id FROM Users`
    db.pool.query(query1, function(error, rows, fields){                            // insert user into table with specified username
        if(error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            db.pool.query(query2, function(error, rows, fields){                    // retrive the user_id of newly created user
                if(error) {
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    let user_id = rows[0];
                    const password = data.password; 
                    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);     // generate a cipher to encrypt password
                    var encrypted = cipher.update(password, 'utf-8', 'hex') + cipher.final('hex');  // update the password to encrypted
                    query3 = `INSERT INTO Passwords (password_id, password) VALUES ('${user_id}', '${encrypted}');` 
                    db.pool.query(query3, function(error, rows, fields){            // add password to Passwords table
                        if(error) {
                            console.log(error);
                            res.sendStatus(400);
                        } else {
                            res.send(user_id);                                      // send the response
                        }
                    });
                }        
            });
        }    
    });
});

/*
Request handler for vaildating a user login
Takes an object containing username and password attributes: {username:[entered username], password:[entered password]}
Retrieves and decrypts the password of the specified user and compares against entered password
Returns in response object the user_id of the validated user within the 'user_id' attribute
If validation fails (incorrect password) the user_id is set to -1
*/
app.post('/login', function(req,res){
    let data = req.body;
    let query1 = `SELECT user_id FROM Users WHERE username = '${data.username}';`
    db.pool.query(query1, function(error, rows, fields){                            // retrieve user_id of entered user
        if(error) {
            console.log(error);
            res.sendStatus(400);
        } else {
            let data = rows[0];
            let query2 = `SELECT password FROM Passwords WHERE password_id = '${user_id}');`
            db.pool.query(query2, function(error, rows, fields){                    // retrieve encrypted password of entered user
                if(error) {
                    console.log(error);
                    res.sendStatus(400);
                } else {
                    const encrypted = rows[0].password;
                    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv); //decrypt password
                    var decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
                    try {
                        assert.equal(decrypted, data.password);                     // compare against entered password
                        res.send(data);                                             // if match, send user_id
                    } catch(error) {
                        data.user_id = -1;  
                        res.send(data);                                             // if no match, send -1
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
