
var db = require('./db');
var clients = {};

var WebSocketServer = require('ws').Server,
    wss;

function connect(port){
  wss = new WebSocketServer({ port: port });

  wss.on('connection', function connection(ws) {
    var room = ws.upgradeReq.url.replace('/', '');
    clients[room] = clients[room] || [];
    clients[room].push(ws);
    ws.send(JSON.stringify(db.getAll(room)));

    ws.on('close', function(){
      clients[room].splice(clients[room].indexOf(ws), 1);
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