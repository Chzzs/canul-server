var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./models/user');

var port = process.env.PORT || 8080;
console.log('database:' + config.database);
mongoose.connect(config.database);
console.log('secret: '+ config.secret);
app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));


app.get('/', function(request, response) {
  response.send('Hello here is the API port' + port );
});

app.get('/setup', function(request, response) {
  var user = new User({
    name: 'Username',
    password: 'password',
    admin: true
  });
  user.save(function (error) {
    if (error) throw error;
    console.log('User saved successfully');
    response.json({success : true});
  });
});

var apiRoutes = require('./api/routes.js');

app.use('/api', apiRoutes);

app.listen(port);
console.log('Please find the magic at '+port);
