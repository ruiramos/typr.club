import view from './view';
import Api from '../api';
import config from '../config';

import Slack from '../slackUtils';

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
                  '<i class="mdi mdi-share"></i>' +
                '</div>' +
              '</div>' +
              '<video loop>' +
                '<source type="video/webm" src="" />' +
                '<source type="video/mp4" src="" />' +
                '<img src="" data-hook="gif-source-fallback" />' +
              '</video>' +
              '<span class="text" data-hook="text-content"></span>' +
              '<div class="share-overlay" style="display:none">' +
                '<div class="sharing-blocker"><p>Loading...</p></div>' +
                '<button class="btn-transparent pull-right" type="button" data-hook="close-share-overlay"><i class="mdi mdi-close"></i></button>' +
                '<div class="slack-share">' +
                  '<a href="https://slack.com/oauth/authorize?scope=commands,chat:write:bot,channels:read&client_id=2168708159.15814809218" data-hook="slack-button-link">' +
                    '<img class="btn-slack-image" alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x">' +
                  '</a>' +
                  '<div data-hook="slack-share">' +
                    '<button class="btn btn-slack btn-large" type="button" data-hook="slack-button">' +
                      '<img src="/slack.png" style="width:12px; opacity:1; position: relative; top:2px; left: -1px "/>' +
                      '<span class="slack-button-share-text">Share on Slack</span>' +
                      '<span class="slack-button-loading-text">Sharing...</span>' +
                    '</button>' +
                    '<div class="slack-share-config">' +
                      '<p style="margin:0">Posting in <select data-hook="slack-room-name"></select> <i class="mdi mdi-close" data-hook="remove-slack-integration"></i></p>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<button class="btn btn-large btn-fb" type="button" data-hook="fb-button">' +
                  '<i class="mdi mdi-facebook"></i> Share on Facebook' +
                '</button>' +
                '<label>Share the GIF file:</label>' +
                '<input type="text" data-hook="gif-url-input" value="" />' +
              '</div>',

  events: {
    'click [data-hook="close-share-overlay"]': 'handleCloseShareOverlay',
    'click .mdi-heart': 'handleHeartClick',
    'click .mdi-share': 'handleShareClick',
    'click [data-hook="slack-button"]': 'handleSlackButtonClick',
    'click [data-hook="fb-button"]': 'handleFacebookButtonClick',

    'click [data-hook=remove-slack-integration]': 'handleRemoveSlackIntegration',
    'change [data-hook="slack-room-name"]': 'setDefaultChannelForRoom'

  },

  props: [
    'id',
    'webmSource',
    'mp4Source',
    'gifSource',
    'likesCount',
    'slackAvailableRooms',
    'slackSharingLoading',
    'textContent'
  ],

  bindings: {
    id: {
      type: 'attribute',
      attribute: 'data-id'
    },
    slackAvailableRooms: [{
      hook: 'slack-share',
      type: 'toggle'
    },{
      hook: 'slack-button-link',
      type: '!toggle'
    }],
    slackSharingLoading: [{
      hook: 'slack-button',
      type: 'toggleClass',
      yes: 'btn-disabled'
    },{
      hook: 'slack-button',
      type: 'attribute',
      attribute: 'disabled'
    }],
    textContent: {
      hook: 'text-content'
    },
    gifSource: {
      hook: 'gif-url-input',
      type: 'attribute',
      attribute: 'value'
    },
    likesCount: {
      hook: 'heart-value'
    },
    webmSource: {
      selector: 'source[type="video/webm"]',
      type: 'attribute',
      attribute: 'src'
    },
    gifSource: {
      hook: 'gif-source-fallback',
      type: 'attribute',
      attribute: 'src'
    },
    mp4Source: {
      selector: 'source[type="video/mp4"]',
      type: 'attribute',
      attribute: 'src'
    }
  },

  initialize: function({videoUrl, text, likes, room, selfie}){
    this.room = room;

    if(!selfie){
      var split = videoUrl.split('/');
      this.id = split[split.length - 1].split('.')[0];

      this.webmSource = config.webmSource + this.id + '.webm';
      this.mp4Source = config.mp4Source + this.id + '.mp4';
      this.gifSource = config.gifSource + this.id + '.gif';

      this.enableSharing();

    } else {
      // this will be a data url
      this.webmSource = videoUrl;
      this.mp4Source = videoUrl;
    }

    this.textContent = text;

    if(!likes){
      this.el.find('.heart-count').hide();
    } else {
      this.likesCount = likes;
    }

    var that = this;
    Slack.getSlackRoomFor(this.room).then(function(rooms){
      if(rooms){
        that.slackAvailableRooms = rooms;
        that.buildSlackChannelsSelect();
      } else {
        that._setSlackLinkUrl(that.el.find('[data-hook="slack-button-link"]'))
      }
    });


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

  _setSlackLinkUrl: function(link){
    // link
    var state = {
      room : this.room,
      id: this.id
    }

    console.log(link, link.src)

    link.attr('href', 'https://slack.com/oauth/authorize?' +
      'scope=commands,chat:write:bot,channels:read' +
      '&client_id=2168708159.15814809218' +
      '&redirect_uri=' + window.location.href.split('?')[0] +
      '&state=' + encodeURIComponent(JSON.stringify(state)));

  },

  buildSlackChannelsSelect: function(){
    var el = this.el.find('[data-hook=slack-room-name]');

    this.slackAvailableRooms.forEach((room) => {
      var opt = $('<option/>');
      opt.attr('value', room.id);
      opt.text(room.name);
      el.append(opt);
    });
  },

  playVideo: function(){
    this.el.find('video').get(0).play();
  },

  handleHeartClick: function(e){
    var that = this;
    Api.videoLiked(this.id, this.room);
  },

  sparklingHearts: function(){
    var heartCount = this.el.find('.heart-count');
    var that = this;

    if(this._heartTimeout){
      clearTimeout(this._heartTimeout);
      this._heartTimeout = null;
      heartCount.removeClass('animate');
      setTimeout(function(){
        heartCount.addClass('animate');
      }, 10);
    } else {
      heartCount.addClass('animate');
    }

    this._heartTimeout = setTimeout(function(){
      heartCount.removeClass('animate');
      that._heartTimeout = null;
    }, 1000);
  },

  handleShareClick: function(e){
    var that = this;
    var el = this.el.find('.share-overlay');
    el.show();

    setTimeout(() => {
      el.addClass('in')
      if(!that._sharingEnabled){
        el.find('.sharing-blocker').show();
      }
    }, 200);

    if(!this.slackAvailableRooms && Slack.getHook(this.room)){
      var that = this;
      Slack.getSlackRoomFor(this.room).then(function(rooms){
        if(rooms){
          that.slackAvailableRooms = rooms;
          that.buildSlackChannelsSelect();
          that.setSelectedSlackRoom();
        }
      });
    } else if(Slack.getHook(this.room)) {
      this.setSelectedSlackRoom();
    } else { //@todo doesnt work!!!
      console.log('gonna remove it')
      this.handleRemoveSlackIntegration();
    }

  },

  handleCloseShareOverlay: function(){
    var el = this.el.find('.share-overlay');
    el.removeClass('in');

    setTimeout(() => el.hide(), 200);
  },

  remove: function(){
    this.el.remove();
  },

  updateLikes: function(likes){
    var heartCount = this.el.find('.heart-count');
    heartCount.show();

    this.sparklingHearts();

    this.likesCount = likes;
  },

  registerSelfie: function(videoUrl){
    var that = this;
    var split = videoUrl.split('/');
    this.id = split[split.length - 1].split('.')[0];

    this.el.removeClass('selfie');
    //this.el.find('[data-hook="gif-url-input"]').val(config.gifSource + this.id + '.gif');

    // updates the slack oauth link to the correct id in the state
    if(!this.slackAvailableRooms){
      this._setSlackLinkUrl(this.el.find('[data-hook="slack-button-link"]'))
    }

    setTimeout(function(){
      that.gifSource = config.gifSource + that.id + '.gif';
      that.enableSharing();
    }, 7500);

    this.selfie = false;
  },

  handleSlackButtonClick: function(){
    var hook = Slack.getHook(this.room);
    var that = this;

    this.slackSharingLoading = true;

    if(hook){
      Api.shareMessage(this.id, this.room, hook, this.el.find('[data-hook=slack-room-name]').val(), function(){
        that.slackSharingLoading = false;
      });
    } else {
      Slack.fireOAuth(this.room, this.id);
    }
  },

  handleFacebookButtonClick: function(){
    var url = 'https://www.facebook.com/dialog/share?' +
                'app_id=910065345749526' +
                '&display=popup' +
                '&href=' + config.gifSource + this.id + '.gif' +
                '&redirect_uri=http://facebook.com';

    window.open(url, 'fbShare', 'width=560, height=650')
  },

  handleRemoveSlackIntegration: function(){
    Slack.removeIntegration(this.room);
    this.slackAvailableRooms = undefined;
  },

  enableSharing: function(){
    this._sharingEnabled = true;
    this.el.find('.sharing-blocker').remove();
  },

  disableSharing: function(){
    this._sharingEnabled = false;
  },

  setDefaultChannelForRoom: function(e){
    var val = $(e.target).val();
    console.log('setting default to ', val);
    Slack.setSelectedSlackRoom(this.room, val);
  },

  setSelectedSlackRoom: function(){
    var id;
    var select = this.slackAvailableRooms.filter((r) => r.select);
    if(select && select.length){
      id = select[0].id;
    }

    if(id){
      console.log('setting that val to', id, this.slackAvailableRooms)
      this.el.find('[data-hook=slack-room-name]').val(id);
    }
  }

});

export default message;