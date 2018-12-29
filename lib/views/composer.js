
import getUserMedia from 'getusermedia';
import RecordRTC from 'ruiramos/recordrtc';
import view from './view';
import api from '../api';

var composer = {};
Object.assign(composer, view, {
  template: '<div>' +
              '<video muted autoplay class="test-video"></video>' +
              '<input type="text" class="test-input" data-hook="chat-input" />' +
            '</div>',

  initialize: function(config){
    var self = this;

    this.refs = {
      video: this.el.find('video'),
      input: this.el.find('input')
    };

    this.streamRecording = false;
    getUserMedia({video: true, audio: false}, function (err, stream){
      self.recordOptions.recorderType = RecordRTC.WhammyRecorder;
      self.recorder = RecordRTC(stream, self.recordOptions);

      let videoEl = self.refs.video.get(0);
      try {
        videoEl.srcObject = stream;
      } catch (error) {
        videoEl.src = window.URL.createObjectURL(stream);
      }

      self.refs.video.addClass('grayscale');

      self.refs.video.get(0).play();
      if(config.fullscreen) self.refs.input.focus();
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

    this.stopRecording(function(videoUrl) {
      console.log(videoUrl, 'getting data url')
      self.recorder.getDataURL(function(videoDataURL) {
        api.upload(self.recorder, videoDataURL, text, self.room);
        app.addSelfie(self.room, self.recorder, videoDataURL, text);
      });
    });
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

