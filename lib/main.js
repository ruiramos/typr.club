import getUserMedia from 'getusermedia';
import $ from 'jquery';
import RecordRTC from 'recordrtc';

var app = {};

var recordOptions = {
   type: 'video',
   // frameRate: 50,
   // quality: 5
};

app.bootstrap = function(){
  this.videoElement = document.querySelector('.test-container video');
  this.inputElement = document.querySelector('.test-container input');

  this.streamRecording = false;

  getUserMedia({video: true, audio: false}, function (err, stream) {
      if (err) {
         console.log('failed');
      } else {
        app.recorder = RecordRTC(stream, recordOptions);
        app.videoElement.src = window.URL.createObjectURL(stream);
        app.videoElement.classList.add('grayscale');

        app.videoElement.onloadedmetadata = function(e) {
          app.videoElement.play();
        };
      }
  });

  // connecting to the websocket
  this.socket = new WebSocket("ws://localhost:8008/");
  this.socket.onmessage = function (event) {
    console.log(event)
    app.addMessageFromWs(event);
  }

}

app.handleKeyUp = function(evt){
  if(evt.which === 13 && evt.target.value.length){
    return this.handleEnter(evt);
  } else {
    this.handleKey(evt);
  }
};

app.handleKey = function(evt){
  if(evt.target.value.length){
    this.videoElement.classList.remove('grayscale');

    if(!this.streamRecording){
      this.startRecording();
    }

  } else {
    this.videoElement.classList.add('grayscale');
    if(this.streamRecording){
      this.stopRecording();
    }
  }
}

app.handleEnter = function(evt){
  this.stopRecording(function(videoUrl) {
    var text = evt.target.value;

    //app.addMessage(videoUrl, text);

    app.resetMessageBlock();

    app.recorder.getDataURL(function(videoDataURL) {
      app.upload(app.recorder, videoDataURL, text)
    });
  });
}

app.resetMessageBlock = function(input){
  this.inputElement.value = '';
  this.videoElement.classList.add('grayscale');
}

app.stopRecording = function(fn){
  this.recorder.stopRecording(fn);
  this.streamRecording = false;
}

app.startRecording = function(){
  this.recorder.startRecording();
  this.streamRecording = true;
}

app.upload = function(video, videoUrl, text){
  var blob = video.getBlob(),
      file = {
        name: generateRandomString() + '.' + blob.type.split('/')[1],
        blob: blob,
        contents: videoUrl,
      };

  $.post('/upload', JSON.stringify({video: file, text: text}), function(res){
    console.log('ok', res);
  });
}

app.addMessageFromWs = function(event){
  var data = JSON.parse(event.data);
  if(data.length){
    data.forEach(function(d){
      this.addMessage(d.video, d.text);
    }, this)
  } else {
    this.addMessage(data.video, data.text);
  }
}

app.addMessage = function(videoUrl, text){
  if(!videoUrl) return;

  var container = document.createElement('div'),
      video = document.createElement('video'),
      span = document.createElement('span');

  container.classList.add('message');

  video.loop = true;
  video.src = videoUrl;
  video.onloadedmetadata = function(e) {
    video.play();
  };

  span.innerText = text;

  container.appendChild(video);
  container.appendChild(span);

  document.querySelector('[data-hook=chat-container]').insertBefore(container,
    document.querySelector('[data-hook=chat-container]').firstChild
  );
}

// go
app.bootstrap();
$('input.test-input').on('keyup', app.handleKeyUp.bind(app));

// generating random string
function generateRandomString() {
    if (window.crypto) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}

