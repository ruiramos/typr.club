
var db = require('./db');

var WebSocketServer = require('ws').Server,
    wss;

function connect(port){
  wss = new WebSocketServer({ port: port });

  wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(db.getAll()));
  });
}

function broadcast(msg){
  wss.clients.forEach(function each(client) {
    console.log(msg)
    client.send(JSON.stringify(msg));
  });
}

module.exports = {
  connect: connect,
  broadcast: broadcast
};