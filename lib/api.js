
import utils from './utils';
import $ from 'jquery';

import 'mdi/css/materialdesignicons.css!'

var socket;

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

var api = {
  createSocket,
  upload,
  saveSubscription,
  videoLiked,
};

export default api;