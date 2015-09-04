
var redis = require("redis"),
    client = redis.createClient();

var messages = {};

var MAX = 50;

function save(msg, room){
  messages[room] = messages[room] || [];
  messages[room].push(msg);
  if(messages[room].length > MAX){
    messages[room].splice(0, messages[room].length - MAX);
  }

  client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', (60 * 60 * 24 * 1), redis.print);

}

function getAll(room, fn){
  console.log('get room', room)
  if(messages[room]){
    fn(messages[room])
  } else {
    client.get("vchat:"+room, function(err, res){
      console.log(res)
      if(!res) {
        messages[room] = [];
      } else {
        messages[room] = JSON.parse(res);
      }
      fn(messages[room]);
    });
  }
}

module.exports = {
  save: save,
  getAll: getAll
};

