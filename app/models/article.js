var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Article', new Schema({
  title: String,
  slug: String,
  created: Date,
  published: Date,
  author: String,
  content: String
}));
