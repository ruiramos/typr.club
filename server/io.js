
var db = require('./db');
var push = require('./push-notifications');
var fs = require('fs');

var clients = {};

var WebSocketServer = require('ws').Server,
    wss,
    broadcastBuffer = {},
    broadcastTimeout;

function _createWssSocket(port){
  var cfg = {
      ssl: true,
      port: port,
      ssl_key: process.env.SSL_KEY,
      ssl_cert: process.env.SSL_CERT
};

  var httpsServ = require('https');

  // dummy request processing
  var processRequest = function( req, res ) {
    res.writeHead(200);
    res.end("All glory to WebSockets!\n");
  };

  var app = httpsServ.createServer({
    // providing server with  SSL key/cert
    key: fs.readFileSync( cfg.ssl_key ),
    cert: fs.readFileSync( cfg.ssl_cert )
  }, processRequest ).listen( cfg.port );

  return new WebSocketServer({server: app});
}

function _createWsSocket(port){
  var cfg = {
    port: port,
  };

  var httpServ = require('http');

  // dummy request processing
  var processRequest = function( req, res ) {
    res.writeHead(200);
    res.end("All glory to WebSockets!\n");
  };

  var app = httpServ.createServer(processRequest)
  app.listen(cfg.port);

  return new WebSocketServer({server: app});
}

function connect(isProd, ports){
  var wss;

  if(!isProd || !process.env.SSL_KEY || !process.env.SSL_CERT){
    wss = _createWsSocket(ports.prod);
  } else {
    wss = _createWssSocket(ports.prod); 
  }

  var self = this;

  wss.on('connection', function connection(ws) {
    var rooms = ws.upgradeReq.url.replace('/', '').split(',');
    //console.log('new socket connection', ws);

    rooms.forEach(function(room){
      clients[room] = clients[room] || [];
      clients[room].push(ws);

      db.getWithOffset(room, 0, function(res){
        ws.send(JSON.stringify({type: 'message:load', data: res, room: room}));
      })

      self.broadcast({type: 'presence', data: {clients: clients[room].length}, room: room}, room);

    });

    // if(rooms.length === 1){
    //   self.broadcast({type: 'presence', data: {clients: clients[rooms[0]].length}}, rooms[0]);
    // }

    ws.on('message', function(res){
      var data = JSON.parse(res);
      switch(data.type){
        case 'request:load':
          db.getWithOffset(data.room, data.offset || 0, function(videos){
            ws.send(JSON.stringify({type: 'message:load', data: videos, room: data.room}));
          })
          break;

        case 'like':
          //console.log(data);
          db.videoLiked(data.id, data.room, function(message){
            clients[data.room].forEach(function(client){
              client.send(JSON.stringify({type: 'like', room: data.room, id: data.id, likes: message.likes}))
            });
          });
          break;
      }
    })

    ws.on('close', function(){
      //console.log('socket connection closed');
      rooms.forEach(function(room){
        clients[room].splice(clients[room].indexOf(ws), 1);

        self.broadcast({type: 'presence', data: {clients: clients[room].length}, room: room}, room);
      });

      // if(rooms.length === 1){
      //   self.broadcast({type: 'presence', data: {clients: clients[rooms[0]].length}}, rooms[0]);
      // }
    })
  });

}

function broadcast(msg, room){
  // can happen if the server restarts and there are hanged clients :/
  if(!clients[room]) return;

  clients[room].forEach(function each(client) {
    client.send(JSON.stringify(msg));
  });

   if(msg.type === 'message:new'){
    push.notify(room, msg);
  }

}

function broadcastDelayed(msg, room){
  var self = this;

  broadcastBuffer[room] = broadcastBuffer[room] || [];
  broadcastBuffer[room].push(msg);

  if(!broadcastTimeout){
    setTimeout(function(){
      broadcastTimeout =  _sendBroadcastBuffer.call(self);
    }, 100);
  }
}

function _sendBroadcastBuffer(){
  Object.keys(broadcastBuffer).forEach(function(room){
    var msg = {type: '', data: []};

    broadcastBuffer[room].forEach(function(m){
      msg.type = msg.type || m.type; // @todo this is wrong... have to separate :new from :load messages!
      msg.room = room;
      msg.data.push(m.data); // need to concat if array in future?!
    })

    this.broadcast(msg, room);

    delete broadcastBuffer[room];
  }, this)

  broadcastTimeout = null;
}

module.exports = {
  connect: connect,
  broadcast: broadcast,
  broadcastDelayed: broadcastDelayed
};
