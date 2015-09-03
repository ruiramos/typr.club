
var messages = [];

var MAX = 50;

function save(msg){
  messages.push(msg);
  if(messages.length > MAX){
    messages.splice(0, messages.length - MAX);
  }
}

function getAll(){
  return messages;
}

module.exports = {
  save: save,
  getAll: getAll
};

