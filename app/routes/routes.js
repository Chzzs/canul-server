var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var slugify = require('slug');

var jwt = require('jsonwebtoken');
var config = require('../config');
var User = require('../models/user');
var Article = require('../models/article');
var Comment = require('../models/comment');



app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));

var router = express.Router();

router.post('/authenticate', function(request, response) {
  var name = request.body.name;
  var password = request.body.password;
  User.findOne({"name": name}, function(error, user) {
    if(error) console.log(error);
    if(!user) {
      response.json({"success": false, "message": "Authentication failed, User not found"});
    } else if (user) {
      if(user.password != password) {
        response.json({"success": false, "message": "Authentication failed, Wrong password"});
      } else {
        var token = jwt.sign(user, app.get("secret"), {"expiresInMinutes": 1440});
        response.json({"success":true, "message": "Authentication succeed", "token": token});
      }
    }
  });
});

router.use(function (request, response, next) {
  var token = request.body.token || request.query.token || request.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get("secret"), function(error, decoded) {
      if (error) {
        return response.json({"success": false, "message": "Failed to authenticate token"});
      } else {
        request.decoded = decoded;
        next();
      }
    });
  } else {
    return response.status(403).send({"success": false, "message": "No token provided"});
  }
});

router.get('/', function(request, response) {
  response.json({message: 'Welcome to the API'});
});


router.route('/users')
  .get(function(request, response) {
    User.find({}, function(error, users) {
      if(error) throw error;
      response.json(users);
    });
  })
  .post(function(request, response) {
    //TODO
  });

  router.use("/articles", require("./articles.js"));
  router.use("/comments", require("./comments.js"));

module.exports = router;
