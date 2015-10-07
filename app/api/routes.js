var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');

var jwt = require('jsonwebtoken');
var config = require('../config');
var User = require('../models/user');

app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));

var router = express.Router();

router.post('/authenticate', function(request, response) {
  User.findOne({
    name: request.body.name
  }, function(error, user) {
    if(error) throw error;
    if(!user) {
      response.json({success:false, message: 'Authentication failed, User not found'});
    } else if (user) {
      if(user.password != request.body.password) {
        response.json({success: false, message: 'Authentication failed, Wrong password'});
      } else {

        var token = jwt.sign(user, app.get("secret"), {
          expiresInMinutes: 1440
        });

        response.json({
          success:true,
          message: 'Authentication succeed',
          token: token
        });
      }
    }
  });
});

router.use(function (request, response, next) {
  var token = request.body.token || request.query.token || request.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get('secret'), function(error, decoded) {
      if (error) {
        return response.json({success: false, message: 'Failed to authenticate token'});
      } else {
        request.decoded = decoded;
        next();
      }
    });
  } else {
    return response.status(403).send({
      success: false,
      message: 'No token provided'
    });
  }
});

router.get('/', function(request, response) {
  response.json({message: 'Welcome to the API'});
});

router.get('/users', function(request, response) {
  User.find({}, function(error, users) {
    response.json(users);
  });
});

module.exports = router;
