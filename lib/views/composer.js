
import RecordRTC from 'ruiramos/recordrtc';
import view from './view';
import api from '../api';

// Pick a container MediaRecorder can produce on this browser. WebM is listed
// first so Chrome/Android keep uploading WebM (unchanged server pipeline);
// iOS/Safari, which don't support WebM recording, fall through to MP4.
function pickSupportedMimeType(){
  if(typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported){
    return null;
  }
  var candidates = ['video/webm', 'video/mp4'];
  for(var i = 0; i < candidates.length; i++){
    if(MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
  }
  return null;
}

var composer = {};
Object.assign(composer, view, {
  template: '<div>' +
              '<video muted autoplay playsinline class="test-video"></video>' +
              '<input type="text" class="test-input" data-hook="chat-input" />' +
            '</div>',

  initialize: function(config){
    var self = this;

    this.refs = {
      video: this.el.find('video'),
      input: this.el.find('input')
    };

    this.streamRecording = false;

    // Use the standard mediaDevices API directly. The old `getusermedia` shim
    // (via webrtc-adapter@2.1.0) gated on the legacy `navigator.getUserMedia`,
    // which iOS Safari never exposes, so it bailed with NotSupportedError before
    // ever calling `navigator.mediaDevices.getUserMedia` - meaning the camera
    // permission prompt never appeared on iOS.
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
      .then(function (stream){
        // Record using the native MediaRecorder where available. It produces a
        // format the recording device can actually play back: WebM on Chrome,
        // MP4 on iOS/Safari. The old WhammyRecorder always emitted VP8 WebM,
        // which iOS Safari can't decode - leaving the local preview blank.
        // Fall back to WhammyRecorder only on browsers without MediaRecorder.
        if(typeof MediaRecorder !== 'undefined' && RecordRTC.MediaStreamRecorder){
          self.recordOptions.recorderType = RecordRTC.MediaStreamRecorder;
          var mimeType = pickSupportedMimeType();
          if(mimeType){
            self.recordOptions.mimeType = mimeType;
          } else {
            delete self.recordOptions.mimeType;
          }
        } else {
          self.recordOptions.recorderType = RecordRTC.WhammyRecorder;
        }

        self.recorder = RecordRTC(stream, self.recordOptions);

        let videoEl = self.refs.video.get(0);
        try {
          videoEl.srcObject = stream;
        } catch (error) {
          videoEl.src = window.URL.createObjectURL(stream);
        }

        self.refs.video.addClass('grayscale');

        videoEl.play();
        if(config.fullscreen) self.refs.input.focus();
      })
      .catch(function (err){
        console.error('Unable to access camera', err);
      });

  },

  events: {
    'keyup .test-input': 'handleKeyUp'
  },

  handleKeyUp: function(evt){
    if(evt.which === 13 && evt.target.value.length){
      this.handleEnter(evt);
    } else {
      this.handleKey(evt);
    }
  },

  handleKey: function(evt){
    if(evt.target.value.length){
      this.refs.video.removeClass('grayscale');

      if(!this.streamRecording){
        this.startRecording();
      }

    } else {
      this.refs.video.addClass('grayscale');
      if(this.streamRecording){
        this.stopRecording();
      }
    }
  },

  handleEnter: function(evt){
    var self = this;

    var text = this.refs.input.val();
    this.resetBlock();

    // just making sure this is not running more than once...
    if(!text || !this.streamRecording) return;

    if(!this.canPost()){
      app.warn({error: 'denied'});
      if(this.recTimeout){
        clearTimeout(this.recTimeout);
        this.recTimeout = null;
      }
      return;
    }

    // Grab a still from the live preview *before* we stop, so the message always
    // has something to show even if the recorded clip can't be played back.
    var poster = this.capturePoster();

    this.stopRecording(function(videoUrl) {
      var blob = self.recorder.getBlob();
      // Preview from an object (blob:) URL rather than a data: URL. iOS WebKit
      // (Safari and especially WKWebView browsers like Chrome/Firefox on iOS)
      // often refuses to play video from a big base64 data: URL, which showed
      // up as a blank square. The data: URL is still used for the upload below.
      var previewUrl = (window.URL || window.webkitURL).createObjectURL(blob);

      self.recorder.getDataURL(function(videoDataURL) {
        api.upload(self.recorder, videoDataURL, text, self.room);
        app.addSelfie(self.room, self.recorder, previewUrl, text, blob.type, poster);
      });
    });
  },

  capturePoster: function(){
    try {
      var video = this.refs.video.get(0);
      if(!video || !video.videoWidth) return null;

      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.7);
    } catch(err) {
      console.warn('Could not capture preview poster', err);
      return null;
    }
  },

  forceRecordingEnd: function(){
    this.handleEnter();
  },

  stopRecording: function(fn){
    if(this.recTimeout){
      clearTimeout(this.recTimeout);
      this.recTimeout = null;
    }

    console.log('gonna stop recording')
    this.recorder.stopRecording(fn);
    this.streamRecording = false;
  },

  startRecording: function(){
    this.recorder.startRecording();
    this.streamRecording = true;

    this.recTimeout = setTimeout(() => {
      this.forceRecordingEnd();
    }, this.maxRecordTime);

  },

  resetBlock: function(){
    this.refs.input.val('');
    this.refs.video.addClass('grayscale');
    this.refs.input.focus();
  },

  canPost: function(){
    if(!this.lastPost || Date.now() - this.lastPost > 3000) {
      this.lastPost = Date.now();
      return true;
    } else {
      return false;
    }
  }
});

export default composer;

