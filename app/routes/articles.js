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

/*
 * [GET]/articles
 *    serve the list of articles to the client, last-id should be specified when looking for more articles to show
 * [POST]/articles
 *    post an article passed on the body of the request.
 */
router.route('/')
  .get(function (request, response) {
    var limit = 5;
    /* create the specified format to return */
    var format = {"title": true, "author": true, "extract": true, "_id": true, "published": true};
    /* retrieve the id of the last article served */
    var last = request.headers["last-article"];
    if(!last) {
      /* articles are query by date , no id is provided */
      Article.find({},format).sort({"published": -1}).limit(limit).exec(function(error, articles) {
        if(error) throw error;
        /* serve the articles list */
        response.json({success: true, articles: articles});
      });
    } else {
      /* first, find the last article served to the client */
      var query = Article.where({ "_id": last});
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
router.route("/:id")
  .get(function(request, response) {
      /* select the id from the request parameters */
      var id = request.params["id"];
      /* create the specified format for the response */
      var format = {"created": false, "slug": false, "extract": false, "__v": false, "content._id":  false };
      /* construct the query */
      var match = {"_id": id};

      Article.findOne(match, format)
        .exec(function(error, article) {
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
    var id = request.params["id"];
    var match = {"_id": id};
    var title = request.body["title"];
    var content = request.body["content"];
    Article.update(match, {"title": title, "content": content})
      .exec(function(error, article) {
        if(error) {
          response.json({"success": false, "message": "an internal error has occured", "error": error});
        } else if(!article) {
          response.json({"success": false, "message": "No article found"});
        } else {
          response.json({"success": true, "message": "Article successfully updated"});
        }
      });
  })
  .delete(function(request, response) {
      var id = request.params["id"];
      var query = Article.where({ "_id" : id});
      query.findOneAndRemove(function(error, article) {
        if(error) console.log(error);
        if(!article) {
          response.json({"success": false, "message": "No article found for given id."});
        } else {
          response.json({"success": true, "message": "Article successfully removed"});
        }
      });
  });

module.exports = router;
