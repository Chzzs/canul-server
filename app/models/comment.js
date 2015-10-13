var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

/* Comment Model */
module.exports = mongoose.model('Comment', new Schema({
  "article": ObjectId,
  "author": String,
  "content": String,
  "published": {"type" : Date, "default": Date.now}
}));
