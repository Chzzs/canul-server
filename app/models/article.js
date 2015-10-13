var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Article', new Schema({
  title: String,
  slug: String,
  created: {type: Date, default: Date.now},
  published: {type: Date, default: Date.now},
  author: String,
  extract: String,
  content: [{
    header: String,
    body: String}],
  image: String,
  comments: [{
    author: String,
    body: String,
    created: {type : Date, default: Date.now}
  }]
}));
