
var db = require('./db');
var clients = {};

var WebSocketServer = require('ws').Server,
    wss;

function connect(port){
  wss = new WebSocketServer({ port: port });
  var self = this;

  wss.on('connection', function connection(ws) {
    var room = ws.upgradeReq.url.replace('/', '');
    clients[room] = clients[room] || [];
    clients[room].push(ws);

    db.getWithOffset(room, 0, function(res){
      ws.send(JSON.stringify({type: 'message:load', data: res}));
    })

    self.broadcast({type: 'presence', data: {clients: clients[room].length}}, room);

    ws.on('message', function(res){
      var data = JSON.parse(res);
      switch(data.type){
        case 'request:load':
          db.getWithOffset(room, data.offset || 0, function(videos){
            ws.send(JSON.stringify({type: 'message:new', data: videos}));
          })
          break;
      }
    })

    ws.on('close', function(){
      clients[room].splice(clients[room].indexOf(ws), 1);
      self.broadcast({type: 'presence', data: {clients: clients[room].length}}, room);
    })
  });

}

function broadcast(msg, room){
  clients[room].forEach(function each(client) {
    client.send(JSON.stringify(msg));
  });
}

module.exports = {
  connect: connect,
  broadcast: broadcast
};