
var messages = [];

function save(msg){
  messages.push(msg);
}

function getAll(){
  return messages;
}

module.exports = {
  save: save,
  getAll: getAll
};

