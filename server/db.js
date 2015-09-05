
var redis = require("redis"),
    client = redis.createClient();

var messages = {};

var MAX = 25;

function save(msg, room){
  if(messages[room]){
    messages[room].push(msg);
    client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', (60 * 60 * 24 * 7), redis.print);

  } else {
    // trying to get again just to be sure
    client.get("vchat:"+room, function(err, res){
      messages[room] = res ? JSON.parse(res) : [];
      // run again with messages set
      save(msg, room, true);
    });
  }

}

function getAll(room, fn){
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

function getWithOffset(room, offset, fn){
  this.getAll(room, function(data){
    console.log(data, data.slice(-MAX-offset, -offset), MAX, offset)
    if(!offset){
      fn(data.slice(-MAX-offset));
    } else {
      fn(data.slice(-MAX-offset, -offset));
    }
  })
}

module.exports = {
  save: save,
  getWithOffset: getWithOffset,
  getAll: getAll,
};

