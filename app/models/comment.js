var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('Comment', new Schema({
  "article": ObjectId,
  "author": String,
  "body": String,
  "created": {"type" : Date, "default": Date.now}
}));
