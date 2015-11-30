import view from './view';
import message from './message';
import { throttle } from 'lodash';

var messages = {};
// var ableToPlay = false;

Object.assign(messages, view, {
  template: '<span/>',

  initialize: function({room}){
    this.handleScrollEvt = throttle(this._handleScrollEvt, 500);

    $(this).on('updated', () => {
      this._handleScrollEvt();
    });

    this._messages = [];

    this.room = room;

    this.el.get(0).addEventListener('click',function(e){
      e.stopPropagation();
      if(e.target.tagName === 'I') return;

      $(this).find('video').each(function(i, vid){ vid.play(); });
      $(this).find('.no-autoplay').each(function(i, el){ el.removeClass('no-autoplay'); });

    },false);
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

  createMessage: function({videoUrl, text, likes}, selfie, prepend){
    if(!videoUrl) return;

    var msg = message.create({
      videoUrl: videoUrl,
      text: text,
      room: this.room,
      likes: likes,
      selfie: selfie
    });

    if(prepend){
      this._messages.unshift(msg);
    } else {
      this._messages.push(msg);
    }

    return msg.el;
  },

  appendMessage: function({videoUrl, text, likes}, silent){
    this.el.append(this.createMessage({
      videoUrl: videoUrl,
      text: text,
      likes: likes
    }));

    if(!silent){ $(this).trigger('updated'); }

    if(!this.fullscreen) this.limitMessages();
  },

  prependMessage: function({videoUrl, text, likes}, silent, msg){
    // @todo identify the message somehow????
    if(msg && msg.uuid === app.config.uuid && this.el.find('.selfie').length === 1){
      // appending one of our own
      this._messages.filter(function(msg){
        if(msg.selfie){
          msg.registerSelfie(videoUrl)
        }
      });
    } else {
      this.el.prepend(this.createMessage({
        videoUrl: videoUrl,
        text: text,
        likes: likes
      }, true));
    }

    if(!silent){ $(this).trigger('updated'); }

    if(!this.fullscreen) this.limitMessages();
  },

  getMessages: function(){
    return this._messages;
  },

  addSelfie: function(rec, video, text){
    var msg = this.createMessage({
      videoUrl: video,
      text: text
    }, true, true);

    $(msg).find('video').get(0).play();

    $(msg).addClass('selfie');

    this.el.prepend(msg);

    if(!this.fullscreen) this.limitMessages();

  },

  removeSelfies: function(){
    this.el.find('.selfie').remove();
  },

  limitMessages: function(){
    var num,
        w = window.innerWidth;

    if(w > 1650){
      num = 9;
    } else if(w > 950){
      num = 7;
    } else {
      num = 5;
    }

    console.log(this.getMessages(), num, this.getMessages().slice(num - this.getMessages().length))

    if(this.getMessages().length > num){
      this.getMessages().slice(num - this.getMessages().length).forEach((m) => m.remove());
      this._messages = this._messages.slice(0, num);
    }
  },

  setLikesInVideo: function(id, likes){
    this._messages.forEach(function(m){
      if(m.id === id){
        m.updateLikes(likes);
      };
    })
  }

});

export default messages;