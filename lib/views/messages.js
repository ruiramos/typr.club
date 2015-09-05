
import view from './view';
import { throttle } from 'lodash';

var messages = {};
// var ableToPlay = false;

Object.assign(messages, view, {
  template: '<span/>',

  initialize: function(){
    this.handleScrollEvt = throttle(this._handleScrollEvt, 500);

    $(this).on('updated', () => {
      this._handleScrollEvt();
    });
  },

  events: {
    'scroll window': 'handleScrollEvt',
    'resize window': 'handleScrollEvt',
  },

  _handleScrollEvt: function(e){
    this.el.find('video').each((i, video) => {
      if(this._isElementVisible(video)){
        if(video.paused) video.play();
      } else {
        if(!video.paused) video.pause();
      }
    });

    if(document.body.scrollTop + window.innerHeight > document.body.scrollHeight - 2 * this.el.find('.message').height()){
      $(this).trigger('request:load');
    }
  },

  _isElementVisible: function(el) {
    var rect = el.getBoundingClientRect();

    return (
        rect.top >= - rect.height &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left >= - rect.width &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  addMessage: function(videoUrl, text, silent){
    if(!videoUrl) return;

    var container = document.createElement('div'),
        video = document.createElement('video'),
        span = document.createElement('span');

    container.classList.add('message');

    video.loop = true;
    video.src = videoUrl;

    video.onloadedmetadata = function() {
      //video.play();
      // ableToPlay = true;
    };

    // $(document.body).on('scroll', function(){
    //   if(!ableToPlay){ video.play(); ableToPlay = true; }
    // });

    span.innerText = text;

    container.appendChild(video);
    container.appendChild(span);

    this.el.prepend(container);

    // var msgElements = this.el.find('div.message');
    // if(msgElements.length > this.maxVideos){
    //   for (var i = this.maxVideos; i < msgElements.length; i++) {
    //     msgElements.get(i).remove();
    //   };
    // }

    if(!silent){ $(this).trigger('updated'); }
  },

  getMessages: function(){
    return this.el.find('.message');
  }

});

export default messages;