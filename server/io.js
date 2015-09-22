
var db = require('./db');
var clients = {};

var WebSocketServer = require('ws').Server,
    wss,
    broadcastBuffer = {},
    broadcastTimeout;

function connect(port){
  wss = new WebSocketServer({ port: port });
  var self = this;

  wss.on('connection', function connection(ws) {
    var rooms = ws.upgradeReq.url.replace('/', '').split(',');

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
      }
    })

    ws.on('close', function(){
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