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


    console.log(this, app);

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
    var container = document.createElement('div');
    container.classList.add('message');

    var video = document.createElement('video'),
        text = document.createElement('span');

    video.loop = true;
    video.src = videoUrl;
    video.onloadedmetadata = function(e) {
      video.play();
    };

    text.innerText = evt.target.value;

    container.appendChild(video);
    container.appendChild(text);

    document.querySelector('[data-hook=chat-container]').insertBefore(container,
      document.querySelector('[data-hook=chat-container]').firstChild
    );

    app.resetMessageBlock();
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

// go
app.bootstrap();
$('input.test-input').on('keyup', app.handleKeyUp.bind(app));


