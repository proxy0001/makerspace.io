var WebSocketServer = require('websocket').server;
// var WebSocketClient = require('websocket').client;
// var WebSocketFrame  = require('websocket').frame;
// var WebSocketRouter = require('websocket').router;
// var W3CWebSocket = require('websocket').w3cwebsocket;
// var ocketServer = require('websocket').server;
var Memcached = require('memcached');
var http = require('http');
var config = require('./config');
var mongoose = require('mongoose');
var express = require('express');
//create  app
var app = express();
//keep reference to config
app.config = config;
var workflow = require('./util/workflow')();

// memcached setting
var mhost = 'localhost:11211';
var memcached = new Memcached(mhost);
cache = {};
// cache setting
cache.clients = {
  key: 'clients',
  lifetime: 7*24*60*60,
  data: {},
  idCounter: 0,
  init: function init () {
    console.log('init');
    memcached.get(this.key, function (err,result) {
      if (err) this.error(err);
      if (result === undefined)  return this.set();
      this.data = result;
    }.bind(this));    
  },
  set: function set (data) {
    console.log('set');
    if (data !== undefined) this.data = data;
    memcached.set(this.key, this.data, this.lifetime, function (err) {
      if (err) return this.error(err);
    }.bind(this)); 
  },
  get: function get (callback) {
    console.log('get');
    if (typeof callback === 'function') return callback(this.data);
    return this.data;
  },
  add: function add (element) {
    console.log('add');
    // this.data[this.idCounter++] = this.stringify(element);
    var id = this.idCounter++;
    this.data[id] = element;
    this.replace();
    return id;
  },
  remove: function remove (id) {
    delete this.data[id];
    this.replace();
  },
  broadcast: function broadcast (callback) {
    if (typeof callback !== 'function') return;
    Object.keys(this.data).forEach(function (key) {
      callback(this.data[key]);
    }.bind(this));
  },
  replace: function replace () {
    console.log('replace');
    return;
    memcached.replace(this.key, this.data, this.lifetime, function (err) { 
      if (err) return this.error(err);
    }.bind(this));
  },  
  error: function error (err) {
    return console.error(err);
  }  
};
cache.clients.init();

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () { console.log('mongoose connect success'); });
//config data models
require('./models')(app, mongoose);

// setup server
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
// setup websocket server
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

// on request
wsServer.on('request', function(request) {
  // if (!originIsAllowed(request.origin)) {
  //   // Make sure we only accept requests from an allowed origin
  //   request.reject();
  //   console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
  //   return;
  // }
  console.log('onrequest');
  var connection = request.accept('echo-protocol', request.origin);
});
wsServer.on('connect', function (connection) {
  // store connections in memcached
  var id = cache.clients.add(connection);

  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    cache.clients.remove(id);
  });

  connection.on('message', function (message) {
    var obj = JSON.parse(message.utf8Data);
    if (message.type !== 'utf8') return connection.sendUTF('{}');
    if (obj.command === 'UPDATE') return workflow.emit('update');
  });

  workflow.emit('init',connection);  
});

workflow.on('update', function () {
  app.db.models.Post.find(function(err, posts){
    if (err) workflow.emit('error', err);
    cache.clients.broadcast(function (connection) {
      workflow.emit('sendPostsLength',{connection: connection, data: posts.length});
    });
  });  
}); 
workflow.on('init', function (connection) {
  app.db.models.Post.find(function(err, posts){
    if (err) workflow.emit('error', err);
    workflow.emit('sendPostsLength',{connection: connection, data: posts.length});
  });    
});
workflow.on('sendPostsLength', function (options) {
  var payload = {
    data: options.data
  };
  options.connection.sendUTF(JSON.stringify(payload));  
});
workflow.on('error', function (err) {
  return console.error(err);
});
