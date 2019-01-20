
import utils from './utils';
import $ from 'jquery';
import secrets from './secrets';

import 'mdi/css/materialdesignicons.css!'

var socket;

function createSocket(room){
  var wsHost = window.location.hostname === 'localhost' ? 
      'ws://localhost:5088' : 'wss://ws.typr.club';

  socket = new WebSocket(wsHost + '/' + room);

  return socket;
}

function upload(video, videoUrl, text, room){
  console.log('will get blob');
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

function shareMessage(id, room, hook, slackRoom, cb){
  var url = 'https://slack.com/api/chat.postMessage';
  var token = hook.token;

  setTimeout(function(){
    $.post(url, {
      token: token,
      channel: slackRoom, //@todo
      text: 'http://files-gif.typr.club/'+id+'.gif (via https://typr.club/'+room+')',
      username: 'typr.club',
      icon_url: 'https://typr.club/images/typr-192.jpg',
      unfurl_media: true
    }).then(function(resp){
      if(cb) cb(resp);
    })
  }, 3000);
}

function getSlackHookWithCode(code, state){
  return $.ajax({
    url: 'https://slack.com/api/oauth.access',
    type: 'GET',
    data: {
      client_id: secrets.slackClientId,
      client_secret: secrets.slackClientSecret,
      code: code,
      redirect_uri: window.location.href.split('?')[0]
    }
  });
//   https://slack.com/api/oauth.access

// client_id     - issued when you created your app (required)
// client_secret - issued when you created your app (required)
// code          - the code param (required)
// redirect_uri  - must match the originally submitted URI (if one was sent)
}

function getSlackChannels(token){
  var url = 'https://slack.com/api/channels.list';
  return $.post(url, {
    token: token,
    exclude_archived: 1
  });
}

var api = {
  createSocket,
  upload,
  saveSubscription,
  videoLiked,
  shareMessage,
  getSlackHookWithCode,
  getSlackChannels
};

export default api;
