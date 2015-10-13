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

/* [GET]/articles, serve the list of articles to the client, last-id should be specified when looking for more articles to show*/
router.get('/articles', function(request, response) {
  //TODO choose wisely a limit
  var limit = 2;
  /* create the specified format to return */
  var format = {"title": true, "author": true, "extract": true, "_id": true, "published": true};
  /* retrieve the id of the last article served */
  var id = request.headers["last-id"];
  if(!id) {
    /* articles are query by date , no id is provided */
    Article.find({},format).sort({"published": -1}).limit(limit).exec(function(error, articles) {
      if(error) throw error;
      /* serve the articles list */
      response.json({success: true, articles: articles});
    });
  } else {
    /* first, find the last article served to the client */
    var query = Article.where({ "_id": id});
    query.findOne(function(error, article) {
      if(error) throw error;
      /* select the publish date */
      var date = article.published;
      /* query the articles older than the date */
      Article.find({}, format).sort({"published": -1}).find({"published" : {$lt: date}}).limit(limit).exec(function(error, articles) {
        if(error) throw error;
        /* serve it to the client */
        response.json({"success": true, "message": "Articles successfully retrieved", "articles": articles});
      });
    });
  }
});

/* [GET]/articles/:id simply serve a full article to the client */
router.get('/articles/:id', function(request, response) {
  /* select the id from the request parameters */
  var id = request.params["id"];
  /* create the specified format for the response */
  var format = {"created": false, "slug": false, "extract": false, "__v": false, "content._id":  false };

  /* construct the query */
  var query = Article.where({ "_id" : id});

  /* query the article */
  query.findOne({}, format, function(error, article) {
    if(error) { console.log(error);}
    if(!article) {
      response.json({"success": false, "message": "article not found"});
    }  else {
      response.json({"success": true, "article": article});
    }
  });
});

/* creates a new article */
router.post('/articles', function(request, response) {

  var title = request.body.title;
  var slug = slugify(title, {lowercase: true});
  var now = new Date();
  var extract = request.body.extract;
  var content = request.body.content;

  var article = new Article({
    title: title,
    slug: slug,
    created: now,
    published: now,
    image: request.body.image,
    extract: extract,
    content: content,
    author: request.body.name
  });

  article.save(function (error) {
    if(error) throw error;
    response.json({success: true, message: 'article successfully put', article: article});
  });
});



/* Delete the article which id is given */
router.delete('/articles/:id', function(request, response) {
    var id = request.body.id;
    var query = Article.where({ "_id" : request.params.id});
    query.findOneAndRemove(function(error, article) {
      if(error) return console.log(error);
      if(!article) {
        response.json({"success": false, "message": "No article found for given id."});
      } else {
        response.json({"success": true, "message": "Article successfully removed"});
      }
    });
});

/* Post a comment to the API, it is bound the article which id is given */
router.post('/articles/:id/comment', function (request, response) {

  var id = request.params.id;

  /* Check if the article exist */
  var query = Article.where({ "_id" : id});
  query.findOne(function (error, article) {
    if(error) return console.log(error);
    if(!article) {
      response.json({"success": false, "message": "no article found for the given id"});
    } else {
      var author = request.body.author;
      var article = article["_id"];
      var body = request.body.body;
      var now = new Date();

      var comment = new Comment({
        "author": author,
        "article": article,
        "created": now,
    //  "edited": now,
        "body": body
      });

      comment.save( function(error) {
        if(error) throw error;
        response.json({"success": true, "message": "comment successfully post", "comment" : comment});
      });
    }
  });
});


router.get('/articles/:slug/comment', function (request, response) {
  /* article is find with its slug */
  var article = request.params.slug;


  /* Find the comments list of the given article */
  var query = Comment.where({"article": article});
  query.find(function(error, comments) {
    if(error) return console.log(error);
    if(!comments) {
      response.json({"success": false, "message": "There is no comment, object not found"});
    } else if (comments.length == 0){
      response.json({"success": false, "message": "There is no comment"});
    } else {
      response.json({"success": true, "message": "Comments list successfully found", "comments": comments});
    }
  });
});


module.exports = router;
