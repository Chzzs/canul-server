var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var slugify = require('slug');

var Comment = require('../models/comment');

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));

var router = express.Router();

router.route("/")
  .get(function(request, response) {
    var match = {};
    var format = {"__v": false};
    Comment.find(match, format)
      .exec( function (error, comments) {
        if(error) throw error;
        if(!comments){ 
          response.json({"success": false, "message":"No comment found"});
        } else if (comments.length == 0) {
          response.json({"success": false, "message": "There is no comment"});
        } else {
          response.json({"success": true, "message": "Comment list successfully retrieved", "comments":comments});
        }
      });
  });


router.route("/:id")
  .get(function(request, response) {
    /* select the id from the request parameters */
    var id = request.params["id"];
    /* create the specified format for the response */
    var format = { "__v": false, "_id":  false };

    /* get the match */
    var match = {"_id": id};
    Comment.findOne(match, format)
      .exec(function(error, comment) {
        if(error) throw error;
        if(!comment) {
          response.json({"success": false, "message": "Comment not found"});
        } else {
          response.json({"success": true, "comment": comment});
        }
      });
  })
  .put(function(request, response){
    var id = request.params["id"];

    var content = request.body["content"];

    var match = {"_id": id};

    Comment.update(match, {"content": content})
      .exec(function(error, comment) {
        if(error) throw error;
        if(!comment) {
          response.json({"success": false, "message": "Comment not found"});
        } else {
          response.json({"success": true, "message": "Comment successfully updated"});
        }
      });
  })
  .delete(function(request, response) {
    var id = request.params["id"];
    var match = {"_id" : id};
    Comment.findOneAndRemove(match)
      .exec(function(error, comment) {
        if(error) throw error;
        if(!comment) {
          response.json({"success": false, "message": "Comment not found"});
        } else {
          response.json({"success": true, "message": "Comment successfully deleted"});
        }
      });
  })

/*
 * [GET]/comments/:id
 *    Get the comment list of the given article id.
 * [POST]/comments/:id
 *    create a comment for the given article id.
 * [PUT]/comments/:id
 *
 * [DELETE]/comments/:id
 *
 */
router.route("/byArticle/:id")
  .get(function(request, response) {

    /* article is find with its id */
    var id = request.params.id;

    var limit = 5;

    /* Specify the match for the document */
    var match = {"article": id};
    /* Specify the format for the response */
    var format = {"__v": false, "article": false};

    /* last-id is retrieved from the header */
    var last = request.headers["last-comment"];

    if(!last) {
      /* articles are query by date , no id is provided */
      Comment.find(match,format)
        .sort({"published": -1})
        .limit(limit)
        .exec(function(error, comments) {
          if(error) throw error;
          /* serve the articles list */
          response.json({"success": true, "comments": comments});
        });
    } else {

      /* first, find the last comments served to the client */
      var query = Comment.where({ "_id": last});
      query.findOne(function(error, comment) {
        if(error) throw error;
        /* select the publish date */
        var date = comment.published;
        /* query the comments older than the date */
        Comment.find(match, format).sort({"published": -1}).find({"published" : {$lt: date}}).limit(limit).exec(function(error, comments) {
          if(error) throw error;
          /* serve it to the client */
          response.json({"success": true, "message": "Comments successfully retrieved", "comments": comments});
        });
      });
    }})
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

router.route("/byUser/:id")
  .get(function(request,response) {
    //TODO
  });



  module.exports = router;
