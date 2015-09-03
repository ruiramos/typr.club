
var messages = [];

function save(msg){
  messages.push(msg);
  if(messages.length > 25){
    messages.splice(0, messages.length - 25);
  }
}

function getAll(){
  return messages;
}

module.exports = {
  save: save,
  getAll: getAll
};

