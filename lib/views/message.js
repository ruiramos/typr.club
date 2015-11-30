import view from './view';
import Api from '../api';
import config from '../config';

var message = {};


Object.assign(message, view, {
  template: '<div class="message">' +
              '<div class="heart-count">' +
                '<i class="mdi mdi-heart"></i>' +
                '<span data-hook="heart-value">3</span>' +
              '</div>' +
              '<div class="overlay">' +
                '<div class="icon-container">' +
                  '<i class="mdi mdi-heart"></i>' +
                  // '<i class="mdi mdi-share"></i>' +
                '</div>' +
              '</div>' +
              '<video loop>' +
                '<source type="video/webm" src="" />' +
                '<source type="video/mp4" src="" />' +
              '</video>' +
              '<span class="text"></span>',

  initialize: function({videoUrl, text, likes, room}){
    var split = videoUrl.split('/');
    this.id = split[split.length - 1].split('.')[0];

    this.room = room;

    this.el.find('source[type="video/mp4"]').attr('src', config.mp4Source + id + '.mp4');
    this.el.find('source[type="video/webm"]').attr('src', config.webmSource + id + '.webm');
    this.el.find('span.text').text(text);

    this.el.find('.mdi-heart').click(this.handleHeartClick.bind(this));
    this.el.find('.mdi-share').click(this.handleShareClick.bind(this));

    if(!likes){
      this.el.find('.heart-count').hide();
    } else {
      this.el.find('[data-hook="heart-value"]').text(likes);
    }

    /**
      Removable messages?
    **/
    // if(false){
    //   var removeEl = document.createElement('span');
    //   removeEl.classList.add('remove-element');
    //   removeEl.textContent = 'x';
    //   container.appendChild(removeEl);
    // }
  },

  playVideo: function(){
    this.el.find('video').get(0).play();
  },

  handleHeartClick: function(e){
    var heartCount = this.el.find('.heart-count');
    heartCount.addClass('animate');
    setTimeout(function(){
      heartCount.removeClass('animate');
    }, 1000);

    Api.videoLiked(this.id, this.room);
  },

  handleShareClick: function(e){
    console.log('click share')
  },

  remove: function(){
    this.el.remove();
  },

  updateLikes: function(likes){
    this.el.find('.heart-count').show();
    this.el.find('[data-hook="heart-value"]').text(likes);
  },

  registerSelfie: function(videoUrl){
    var split = videoUrl.split('/');
    this.id = split[split.length - 1].split('.')[0];

    this.el.removeClass('selfie');
  }

});

export default message;