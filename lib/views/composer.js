
import getUserMedia from 'getusermedia';
import RecordRTC from 'recordrtc';
import view from './view';
import api from '../api';

var composer = {};
Object.assign(composer, view, {
  template: '<div>' +
              '<video class="test-video"></video>' +
              '<input type="text" class="test-input" data-hook="chat-input" />' +
            '</div>',

  initialize: function(config){
    var self = this;

    this.refs = {
      video: this.el.find('video'),
      input: this.el.find('input')
    };

    this.streamRecording = false;
    this.maxRecordTime = 5 * 1000;

    getUserMedia({video: true, audio: false}, function (err, stream) {
        if (err) {
           console.log('failed');
        } else {
          self.recorder = RecordRTC(stream, self.recordOptions);

          self.refs.video.attr('src', window.URL.createObjectURL(stream));
          self.refs.video.addClass('grayscale');

          self.refs.video.get(0).onloadedmetadata = function(e) {
            self.refs.video.get(0).play();
            self.refs.input.focus();
          };
        }
    });
  },

  events: {
    'keyup input.test-input': 'handleKeyUp'
  },

  handleKeyUp: function(evt){
    if(evt.which === 13 && evt.target.value.length){
      return this.handleEnter(evt);
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

    this.stopRecording(function(videoUrl) {
      var text = self.refs.input.val();

      self.resetBlock();

      self.recorder.getDataURL(function(videoDataURL) {
        api.upload(self.recorder, videoDataURL, text, self.room);
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
});

export default composer;

