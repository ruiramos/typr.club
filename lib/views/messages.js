
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
    // video.poster = videoUrl
    //                 .replace('webm', 'png')
    //                 .replace('typr.club', 'typr.club-mp4');

    var webMSource = document.createElement('source');
    webMSource.src = videoUrl;
    webMSource.type = 'video/webm';

    var mp4Source = document.createElement('source');
    mp4Source.src = videoUrl
                      .replace('webm', 'mp4')
                      .replace('typr.club', 'typr.club-mp4');
    mp4Source.type = 'video/mp4';

    video.appendChild(webMSource);
    video.appendChild(mp4Source);

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


    span.textContent = text;

    container.appendChild(video);
    container.appendChild(span);

    /**
      Removable messages?
    **/
    if(false){
      var removeEl = document.createElement('span');
      removeEl.classList.add('remove-element');
      removeEl.textContent = 'x';
      container.appendChild(removeEl);
    }

    return container;
  },

  appendMessage: function(videoUrl, text, silent){
    this.el.append(this.createMessage(videoUrl, text));
    if(!silent){ $(this).trigger('updated'); }
  },

  prependMessage: function(videoUrl, text, silent, msg){
    // @todo identify the message somehow????
    if(msg && msg.uuid === app.config.uuid && this.el.find('.selfie').length === 1){
      // appending one of our own
        this.el.find('.selfie')
          .removeClass('selfie');
    } else {
      this.el.prepend(this.createMessage(videoUrl, text));
    }

    if(!silent){ $(this).trigger('updated'); }
  },

  getMessages: function(){
    return this.el.find('.message');
  },

  addSelfie: function(rec, video, text){
    var msg = this.createMessage(video, text);
    $(msg).find('video').get(0).play();

    $(msg).addClass('selfie');

    this.el.prepend(msg);
  },

  removeSelfies: function(){
    this.el.find('.selfie').remove();
  }

});

export default messages;