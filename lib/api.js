
import utils from './utils';
import $ from 'jquery';

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

var api = {
  upload: upload
};

export default api;