//1

// var express = require("express");
// var app = express();
// var cors = require('cors')
// var router = express.Router();
// const port = 3000

// var path = __dirname;

// router.use(function (req,res,next) {
//   console.log("/" + req.method);
//   next();
// });

// router.get("/",function(req,res){
//   res.sendFile(path +"/index.html");
//   res.sendFile(path + "/js/p5.speech.js");
// });

// app.use("/",router);

// app.use("*",function(req,res){
//   res.sendFile(path + "404.html");
// });

// app.use(express.static('public'))

// app.use(cors())

// app.get('/', function (req, res, next) {
//   res.json({msg: 'This is CORS-enabled for all origins!'})
// })

// app.listen(3000,function(){
//   console.log("Live at Port 3000");
// });

//2

var express = require('express');
var path = require('path');
var cors = require('cors')
var app = express();

app.use(cors());
app.options('*', cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
});

// Define the port to run on
app.set('port', 3000);

app.use(express.static(path.join(__dirname, 'prototype')));

// Listen for requests
var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Magic happens on port ' + port);
});


//3
// app.use(cors())

// app.get('/', function (req, res, next) {
//   res.json({msg: 'This is CORS-enabled for all origins!'})
// })

// var express = require('express');  
// var request = require('request');

// var app = express();  
// app.use('/', function(req, res) {  
//   var url = "https://www.quandl.com/api/v3/datasets/WIKI/FB/data.json?api_key=iz12PA5nC-YLyESare9X";
//   req.pipe(request(url)).pipe(res);
// });

// app.listen(process.env.PORT || 3000);  


//4

// var app = require('express')();
// var server = require('http').Server(app);
// var io = require('socket.io')(server);

// io.set('origins', '*:*');

// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
//   res.header('Access-Control-Expose-Headers', 'Content-Length');
//   res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
//   if (req.method === 'OPTIONS') {
//     return res.send(200);
//   } else {
//     return next();
//   }
// });

// server.listen(80);

// app.get('/', function (req, res) {
//   res.send('OK');
// });

// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });