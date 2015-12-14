var fs = require('fs');
var path = require('path');
var http = require('http')

// Load env variables
require('dotenv').load();

var express = require('express');
var app = express();

// Set the views directory
app.set('views', __dirname + '/views');

// Define the view templating engine
app.set('view engine', 'jade');

// Load all routes in the routes directory
fs.readdirSync('./routes').forEach(function(file) {
  if (path.extname(file) == '.js') {
    console.log("Adding routes in " + file);
    require('./routes/' + file).init(app);
  }
});

// Handle static files
app.use(express.static(__dirname + '/public'));

// Catch any routes not already handled with an error message
app.use(function(req,res) {
  var message = 'Error, did not understand path ' + req.path;
  res.status(404).render('error', { 'message': message });
})

var httpServer = http.createServer(app);

var ipaddress = '127.0.0.1';
var port = 50000;

httpServer.listen(
  port,
  ipaddress,
  function() {
    console.log('Listening on ' + ipaddress + ':' + port)
  });
