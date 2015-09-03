
var messages = {};

var MAX = 50;

function save(msg, room){
  messages[room] = messages[room] || [];
  messages[room].push(msg);
  if(messages[room].length > MAX){
    messages[room].splice(0, messages[room].length - MAX);
  }
}

function getAll(room){
  return messages[room] || [];
}

module.exports = {
  save: save,
  getAll: getAll
};

