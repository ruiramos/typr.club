
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
        if(video.paused) {
          video.play();

          // mobile phones, always them
          if(video.paused){
            this.el.find('.message').addClass('no-autoplay');
          }

        }
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

  createMessage: function(videoUrl, text){
    if(!videoUrl) return;

    var container = document.createElement('div'),
        video = document.createElement('video'),
        span = document.createElement('span');

    container.classList.add('message');

    span.classList.add('text');

    video.loop = true;
    video.src = videoUrl;

    /**
      This is for mobile phones - videos need user interaction to play
    **/
    this.el.get(0).addEventListener('click',function(){
      video.play();
      video.parentElement.classList.remove('no-autoplay');
    },false);

    /**
      Is this useful? Not sure. Should work on mobile but doesnt for some reason
    **/
    video.addEventListener('click', function(){
      video.currentTime = 0;
      video.play();
    },false);


    span.innerText = text;

    container.appendChild(video);
    container.appendChild(span);

    /**
      Removable messages?
    **/
    if(false){
      var removeEl = document.createElement('span');
      removeEl.classList.add('remove-element');
      removeEl.innerText = 'x';
      container.appendChild(removeEl);
    }

    return container;
  },

  appendMessage: function(videoUrl, text, silent){
    this.el.append(this.createMessage(videoUrl, text));
    if(!silent){ $(this).trigger('updated'); }
  },

  prependMessage: function(videoUrl, text, silent){
    this.el.prepend(this.createMessage(videoUrl, text));
    if(!silent){ $(this).trigger('updated'); }
  },

  getMessages: function(){
    return this.el.find('.message');
  }

});

export default messages;