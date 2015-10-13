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

router.get('/users', function(request, response) {
  User.find({}, function(error, users) {
    response.json(users);
  });
});



/*
 * [GET]/articles
 *    serve the list of articles to the client, last-id should be specified when looking for more articles to show
 * [POST]/articles
 *    post an article passed on the body of the request.
 */
router.route('/articles')
  .get(function (request, response) {
    var limit = 5;
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
  })
  .post(function (request, response) {
    /* creates a new article */
      var title = request.body.title;
      var author = request.body.author;
      var slug = slugify(title, {lowercase: true});
      var extract = request.body.extract;
      var image = request.body.image;
      var content = request.body.content;

      var article = new Article({
        "title": title,
        "slug": slug,
        "image": image,
        "extract": extract,
        "content": content,
        "author": author
      });

      article.save(function (error) {
        if(error) throw error;
        response.json({"success": true, "message": "article successfully put", "article": article});
      });
    });

/*
 * [GET]/articles/:id
 *    Get the specified article
 * [PUT]/articles/:id
 * [DELETE]/articles/:id
 *    Delete the article which id is given
 */
router.route('/articles/:id')
  .get(function(request, response) {
      /* select the id from the request parameters */
      var id = request.params["id"];
      /* create the specified format for the response */
      var format = {"created": false, "slug": false, "extract": false, "__v": false, "content._id":  false };

      /* construct the query */
      var query = Article.where({ "_id" : id});

      /* query the article */
      query.findOne({}, format, function(error, article) {
        /* if the query failed */
        if(error) { console.log(error);}
        if(!article) {
          response.json({"success": false, "message": "article not found"});
        }  else {
          response.json({"success": true, "article": article});
        }
      });
    })
  .put(function(request, response) {
    //TODO
  })
  .delete(function(request, response) {
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

/*
 * [GET]/comments/:id
 *    Get the comment list of the given article id.
 * [POST]/comments/:id
 *    create a comment for the given article id.
 */
router.route("/comments/:id")
  .get(function(request, response) {
    /* article is find with its slug */
    var id = request.params.id;

    /* Specify the match for the document */
    var match = {"article": id};
    /* Specify the format for the response */
    var format = {"__v": false, "article": false};

    /* Find the comments list of the given article */
    Comment.find(match,format).exec(function(error, comments) {
      if(error) console.log(error);
      if(!comments) {
        response.json({"success": false, "message": "There is no comment, object not found"});
      } else if (comments.length == 0){
        response.json({"success": false, "message": "There is no comment"});
      } else {
        response.json({"success": true, "message": "Comments list successfully found", "comments": comments});
      }
    });
  })
  .post(function(request, response) {
      /* Retrieve the id from the parameters list */
      var id = request.params.id;

      /* Check if the article exist */
      var match = {"_id": id};

      Article.findOne(match).exec(function (error, article) {
        if(error) console.log(error);
        if(!article) {
          response.json({"success": false, "message": "no article found for the given id"});
        } else {
          var author = request.body.author;
          var article = article["_id"];
          var content = request.body.content;
          var now = new Date();
          var comment = new Comment({
            "author": author,
            "article": article,
            "published": now,
            "content": content
          });
          comment.save( function(error) {
            if(error) throw error;
            response.json({"success": true, "message": "comment successfully post", "comment" : comment});
          });
        }
      });
  });



/* Post a comment to the API, it is bound the article which id is given */



router.get('/articles/:id/comments', function (request, response) {

});

router.delete('/articles/:articleId/comments/:commentId', function(request, response) {

  var commentId = request.params.commentId

});


module.exports = router;
