var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame  = require('websocket').frame;
var WebSocketRouter = require('websocket').router;
var W3CWebSocket = require('websocket').w3cwebsocket;

ocketServer = require('websocket').server;
var http = require('http');

var config = require('./config');
var mongoose = require('mongoose');
var express = require('express');
//create  app
var app = express();
//keep reference to config
app.config = config;

//setup utilities
app.utility = {};
app.utility.workflow = require('./util/workflow');

//keep connections referecce to connections
app.connections = [];

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  //and... we have a data store
  console.log('mongoose connect success');
});
//config data models
require('./models')(app, mongoose);

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

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

wsServer.on('request', function(request) {
    // if (!originIsAllowed(request.origin)) {
    //   // Make sure we only accept requests from an allowed origin
    //   request.reject();
    //   console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    //   return;
    // }

    var connection = request.accept('echo-protocol', request.origin);
    var workflow = app.utility.workflow(request);
    
    app.connections.push(connection);

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    
    connection.on('message', function(message) {
    		var obj = JSON.parse(message.utf8Data);
    		
    		if (message.type !== 'utf8'){
    			return workflow.emit('error');
    		}	
				
				if (obj.command === 'UPDATE'){
          return workflow.emit('update');
        }

    });



		workflow.on('update', function () {
      app.db.models.Post.find(function(err, posts){
        if (err) workflow.emit('error');

        var payload = {
        	data: posts.length
        };

				app.connections.forEach(function (element, index) {
				  	element.send(JSON.stringify(payload));
				});  

      });  	
		});    

		workflow.on('error', function (){
			return connection.sendUTF('{}');
		});
});
