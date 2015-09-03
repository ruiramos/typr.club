
import utils from './utils';
import $ from 'jquery';

function upload(video, videoUrl, text, room){
  var blob = video.getBlob(),
      file = {
        name: utils.generateRandomString() + '.' + blob.type.split('/')[1],
        blob: blob,
        contents: videoUrl,
      };

  $.post('/upload', JSON.stringify({video: file, text: text, room: room}), function(res){
    console.log('ok', res);
  });
}

var api = {
  upload: upload
};

export default api;