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

router.get('/articles', function(request, response) {
  Article.find({}, function(error, articles) {
    response.json({success: true, articles: articles});
  });
});

router.get('/articles/:slug', function(request, response) {
  var query = Article.where({ "slug" : request.params.slug});
  query.findOne(function(error, article) {
    if(error) return console.log(error);
    if(!article) {
      response.json({success: false, message: 'article not found'});
    }  else {
      response.json({success: true, article: article});
    }
  });
});

router.put('/articles', function(request, response) {
  var title = request.body.title;
  var slug = slugify(title, {lowercase: true});
  var now = new Date();

  var article = new Article({
    title: title,
    slug: slug,
    created: now,
    published: now,
    content: request.body.content,
    author: request.body.name
  });

  article.save(function (error) {
    if(error) throw error;
    response.json({success: true, message: 'article successfully put', article: article});
  });
});

router.delete('/articles/:slug', function(request, response) {
    var slug = request.body.slug;
    var query = Article.where({ "slug" : request.params.slug});
    query.findOneAndRemove(function(error, article) {
      if(error) return console.log(error);
      if(!article) {
        console.log('lalala');
        response.json({success: false, message: 'article not found'});
      } else {
        response.json({success: true, message: 'article successfully removed'});
      }
    });
});

module.exports = router;
