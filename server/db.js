
var redis = require("redis"),
    client = redis.createClient();

var messages = {};

var ROOM_MESSAGE_EXPIRY = (60 * 60 * 24 * 7 * 2) // 2 weeks

// number of messages loaded in each request
var MAX = 25;

// lock stuff
var locks = {
  minute: 10,
  day: 2000
}

function save(msg, room){
  if(messages[room]){
    messages[room].push(msg);
    client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', ROOM_MESSAGE_EXPIRY, redis.print);

  } else {
    // trying to get again just to be sure
    client.get("vchat:"+room, function(err, res){
      messages[room] = res ? JSON.parse(res) : [];
      // run again with messages set
      save(msg, room, true);
    });
  }
}

function setUserLock(uuid, room, ip){
  // 1 per 2 sec (per uuid)
  client.set("vchat:user:"+uuid+room, 'locked', 'EX', 2);

  // limits per minute (ip)
  var userMinuteKey = "vchat:userip:"+ip
  client.llen(userMinuteKey, function(err, res){
    if(!res){
      client.rpush(userMinuteKey, userMinuteKey);
      client.expire(userMinuteKey, 60);
    } else {
      client.rpushx(userMinuteKey, userMinuteKey);
    }
  })

  // limits per day (ip)
  var userDailyKey = "vchat:userip:"+ip+":daily";
  client.llen(userDailyKey, function(err, res){
    if(!res){
      client.rpush(userDailyKey, userDailyKey);
      client.expire(userDailyKey, 60 * 60 * 24);
    } else {
      client.rpushx(userDailyKey, userDailyKey);
    }
  })
}

function canUserPost(uuid, room, ip, cb){
  // 1 per 2 seconds (per room)
  client.get("vchat:user:"+uuid+room, function(err, res){
    if(res) return cb(false);

    // minute lock
    client.llen("vchat:userip:"+ip, function(err, res2){
      if(+res2 > locks.minute){
        return cb(false);
      }

      // day lock
      client.llen("vchat:userip:"+ip+":daily",  function(err, res3){
        if(+res3 > locks.day){
          return cb(false);
        }

        cb(true);
      })
    })
  })
}

function getAll(room, fn){
  if(messages[room]){
    fn(messages[room])
  } else {
    client.get("vchat:"+room, function(err, res){
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
    if(!offset){
      fn(data.slice(-MAX-offset));
    } else {
      fn(data.slice(-MAX-offset, -offset));
    }
  })
}

function remove(ids, room, number){
  if(!ids instanceof Array){
    ids = [ids];
  }

  if(messages[room]){
    if(!number){
      _removeWithIds(ids, room);
    } else {
      _removeWithSplice(ids[0], room, number);
    }

    client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', ROOM_MESSAGE_EXPIRY, redis.print);
  } else {
    this.getAll(room, function(){
      if(messages[room]){
        if(!number){
          _removeWithIds(ids, room);
        } else {
          _removeWithSplice(ids[0], room, number);
        }

        client.set("vchat:"+room, JSON.stringify(messages[room]), 'EX', ROOM_MESSAGE_EXPIRY, redis.print);
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
      temp = messages[room].slice().reverse();

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

/**
  Notifications

**/

function updateUserRegistration(id, rooms, uuid, cb){
  if(!rooms) return;
  rooms.forEach(function(room){
    client.sadd('vchat:notifications:' + room, id);
    client.hset('vchat:userids', id, uuid, function(){}) // gcm id -> uuid
  })
}

function getNotificationsIdForRoom(room, cb){
  client.smembers('vchat:notifications:' + room, cb);
}

function filterUserIdsForNotifications(ids, messages, cb){
  var filteredIds = [];
  var uniqueUuid = _getUniqueUuidFrom(messages);

  client.hmget('vchat:userids', ids, function(err, uuids){
    uuids.forEach(function(uuid, i){
      // decide
      if(!uniqueUuid || uniqueUuid !== uuid){
        filteredIds.push(ids[i]);
      }
    });

    cb(filteredIds);
  })
}

function _getUniqueUuidFrom(messages){
  var uuids = messages.data.map(function(msg){ return msg.uuid; });
  var uniq = uuids.reduce(function(memo, el){
    if(memo.indexOf(el) === -1){
      memo.push(el);
    }

    return memo;
  }, []);

  if(uniq.length === 1){
    // they're all the same
    return uniq[0];
  } else {
    // just for clarity
    return undefined;
  }
}

module.exports = {
  save: save,
  getWithOffset: getWithOffset,
  getAll: getAll,
  remove: remove,

  canUserPost: canUserPost,
  setUserLock: setUserLock,

  updateUserRegistration: updateUserRegistration,
  getNotificationsIdForRoom: getNotificationsIdForRoom,
  filterUserIdsForNotifications: filterUserIdsForNotifications
};

