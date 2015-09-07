
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

function remove(ids, room, number){
  if(![] instanceof Array){
    ids = [ids];
  }

  if(messages[room]){
    if(!number){
      _removeWithIds(ids, room);
    } else {
      _removeWithSplice(ids[0], room, number);
    }

    client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', (60 * 60 * 24 * 7), redis.print);
  } else {
    this.getAll(room, function(){
      if(messages[room]){
        if(!number){
          _removeWithIds(ids, room);
        } else {
          _removeWithSplice(ids[0], room, number);
        }

        client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', (60 * 60 * 24 * 7), redis.print);
      }
    });
  }
}

function _removeWithIds(ids, room){
  messages[room] = messages[room].filter(function(el){
    return ids.every(function(id){ return (el.video.indexOf(id+'.webm') === -1); })
  });
}

function _removeWithSplice(id, room, number){
  var index,
      temp = messages[room].reverse()

  for (var i = temp.length - 1; i >= 0; i--) {
    if(temp[i].video && temp[i].video.indexOf(id+'.webm') > -1){
      index = i;
      break;
    }
  };

  if(index !== undefined){
    temp.splice(index, number);
    messages[room] = temp.reverse();
  }

}

module.exports = {
  save: save,
  getWithOffset: getWithOffset,
  getAll: getAll,
  remove: remove,
};

