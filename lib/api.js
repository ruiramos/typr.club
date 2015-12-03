
import utils from './utils';
import $ from 'jquery';

import 'mdi/css/materialdesignicons.css!'

var socket;
var _slackRooms = {
  ometria: 'https://hooks.slack.com/services/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',
  'amigos-de-coimbra': 'https://hooks.slack.com/services/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'
};

function createSocket(room){
  var wsHost = window.location.hostname === 'localhost' ? 'ws://localhost:8008' : 'wss://ruiramos.com:5282';

  socket = new WebSocket(wsHost + '/' + room);

  return socket;
}

function upload(video, videoUrl, text, room){
  var blob = video.getBlob(),
      file = {
        name: utils.generateRandomString() + '.' + blob.type.split('/')[1],
        blob: blob,
        contents: videoUrl,
      };

  $.ajax({
    url: '/upload',
    type: 'POST',
    data: JSON.stringify({video: file, text: text, room: room, uuid: app.config.uuid}),
  })
  .fail(function(err){
    if(err.status !== 200)
      app.warn(err.responseJSON);
  });
}

function saveSubscription(endpoint, rooms, uuid){
  $.ajax({
    url: '/api/subscription',
    type: 'POST',
    data: JSON.stringify({endpoint: endpoint, rooms: rooms, uuid: uuid}),
  });
}

function videoLiked(id, room){
  socket.send(JSON.stringify({
    type: 'like',
    room: room,
    id: id
  }));
}

function shareMessage(id, room){

  if(!_slackRooms[room]){
    _slackRooms[room] = prompt('enter slack hook url for room ' + room);
  }

  if(!_slackRooms[room]) return;

  setTimeout(function(){
    $.post(_slackRooms[room], {
      payload: JSON.stringify({
        text: 'http://files-gif.typr.club/'+id+'.gif',
        username: 'typr.club',
        icon_url: 'https://typr.club/typr-192.jpg'
      })
    })
  }, 5000);
}

var api = {
  createSocket,
  upload,
  saveSubscription,
  videoLiked,
  shareMessage
};

export default api;