var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user');
var Article = require('./models/article');
var Comment = require('./models/comment');

var port = process.env.PORT || 8080;

app.set('views', '../public/jade');
app.set('view engine', 'jade');


console.log('database:' + config.database);
mongoose.connect(config.database);
console.log('secret: '+ config.secret);
app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));


app.get('/', function(request, response) {
  response.render('index', {title:'API Index', message:'Authentication'});
});

app.use(express.static('public'));


app.get('/setup', function(request, response) {
  var user = new User({
    name: 'user',
    password: 'password',
    admin: false });

  var admin = new User({
    name: 'admin',
    password: 'password',
    admin: true  });

  user.save(function (error) {
    if (error) throw error;
    console.log('user saved successfully');
  });

  admin.save(function (error) {
    if (error) throw error;
    console.log('admin saved successfully');
  });

});

var routes = require("./routes/routes.js");
app.use('/api', routes);

app.listen(port);
console.log('Please find the magic at '+port);
