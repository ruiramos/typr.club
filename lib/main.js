import $ from 'jquery';
import cookie from 'cookie';
import uuid from 'uuid';
import _ from 'lodash';


import api from './api';
import utils from './utils';
import Slack from './slackUtils';

import roomsContainer from './views/roomsContainer';
import topbar from './views/topbar';
import popup from './views/popup';
import notifications from './views/notifications';

var app = window.app = {
  bootstrap: function(){
    this.initCookies();

    if(!utils.userInRoom()){ // in homepage
        $.get('/english-nouns.json', function(words){
          var wordsArray = JSON.parse(words);

          var rand = utils.sample(wordsArray.adj) + '-' + utils.sample(wordsArray.nouns) + '-' + utils.sample(wordsArray.nouns);
          $('input[data-hook="goto-input"]').val(rand);
          $('input[data-hook="goto-input"]').focus();
       });

      $('button[data-hook="goto"]').on('click', function(){
        window.location.href = window.location.href + encodeURIComponent($('input[data-hook="goto-input"]').val());
      });

      $('input[data-hook="goto-input"]').on('keyup', function(e){
        if(e.which === 13) $('button[data-hook="goto"]').click();
      })

      if(!this.getRoom()) {
        $('span.fake-input').on('click', function(e){
          if(!$(e.target).is('input')){
            $('span.fake-input input').focus();
          }
        })

        return; // dont show any videos, anything

      } else {
        $('.home-subscriptions').show();
      }
    }

    this.config = {
      recordOptions: {
        type: 'video'
       // mimeType: 'video/webm', // or video/mp4 or audio/ogg
      //  videoBitsPerSecond: 128000
      },
      room: this.getRoom(),
      uuid: this.getUuid(),
      subscribed: this.getSubscribed(),
      title: '~ typr.club',
      baseTitle: 'typr.club'
    };

    this.missedCalls = 0;

    this.views = {
      roomsContainer: {},
      topbar:   topbar.create({hook: 'top-bar'}),
      popup : popup.create({hook: 'notifications'}),
      notifications: notifications.create({hook: $(document.body)})
    };

    this.config.room.split(',').forEach(function(room){
      this.views.roomsContainer[room] = roomsContainer.create({
        hook: 'rooms',
        room: room,
        fullscreen: !utils.userInDashboard()
      });
    }, this);

    app.warn = this.views.popup.warn.bind(this.views.popup);

    app.addSelfie = function(room){
      var args = Array.prototype.slice.call(arguments, 1);
      this.views.roomsContainer[room].addSelfie.apply(this.views.roomsContainer[room], args);
    };

    if(!utils.userInDashboard()){
      $(this.views.roomsContainer[app.config.room].messages).on('request:load', this.loadMoreVideos.bind(this));
    }

    document.addEventListener(utils.visibilityChange, this.handleVisibilityChange.bind(this), false);

    this.createSocket();
    this.renderApp();

    return this;
  },

  renderApp: function(){
    Object.keys(this.views).forEach((view) => {
      if(view === 'roomsContainer'){
        Object.keys(this.views[view]).forEach((v) => this.views[view][v].render());
      } else {
        this.views[view].render()
      }
    })

    Slack.checkSlackParams();

  },

  initCookies: function(){
    var cookies = cookie.parse(document.cookie);
    if(cookies.typrData){
      this.cookies = JSON.parse(cookies.typrData);
    } else {
      var myuuid = uuid.v1();
      this.cookies = {
        uuid: myuuid,
        subscribed: []
      };

      this.updateCookie(this.cookies);
    }
  },

  updateCookie: function(theCookie){
    var nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    document.cookie = cookie.serialize('typrData', JSON.stringify(theCookie), {
      path: '/',
      expires: nextYear
    });
  },

  getUuid: function(){
    return this.cookies.uuid;
  },

  getSubscribed: function(){
    return this.cookies.subscribed || [];
  },

  getRoom: function(){
    var room = window.location.pathname.replace('/', '');
    if(room){
      return room;
    } else {
      var subscribed = this.getSubscribed();
      return subscribed && subscribed.length ? subscribed.join(',') : '';
    }
  },

  createSocket: function(){
    // connecting to the websocket
    this.socket = api.createSocket(this.config.room);

    this.socket.onmessage = (evt) => {
      var event = JSON.parse(evt.data);
      switch(event.type){
        case 'message:load':
          this.addMessageFromWs(event.data, event.room, true);
          break;

        case 'message:new':
          this.addMessageFromWs(event.data, event.room);
          break;

        case 'presence':
          utils.userInDashboard() ?
            this.views.roomsContainer[event.room].updateConnectedClients(event.data.clients) :
            this.views.topbar.updateConnectedClients(event.data.clients);
          break;

        case 'like':
          this.views.roomsContainer[event.room].setLikesInVideo(event.id, event.likes);
          break;
      }
    };

    this.socket.onclose = (evt) => {
      console.log('socket connection closed', evt);
      setTimeout(() => {
        this.socket = api.createSocket(this.config.room);
      }, 500);
    }
  },

  addMessageFromWs: function(data, room, loadRequest){
    //var data = JSON.parse(eventData);

    if(loadRequest){
      if(utils.userInDashboard()){
        var w = window.innerWidth;
        if(w > 1650){
         if(data.length > 9) data = data.slice(data.length - 9);
        } else if(w > 950){
         if(data.length > 7) data = data.slice(data.length - 7);
        } else {
         if(data.length > 5) data = data.slice(data.length - 5);
        }
      }

      data.reverse();
    }


    data.forEach((d) => {
      loadRequest ?
        this.views.roomsContainer[room].appendMessage({
          videoUrl: d.video,
          text: d.text,
          likes: d.likes
        }, true, d) :
        this.views.roomsContainer[room].prependMessage({
          videoUrl: d.video,
          text: d.text,
          likes: d.likes
        }, true, d);
    });

    if(data.length){
      this.views.roomsContainer[room].removeSelfies();
      $(this.views.roomsContainer[room]).trigger('updated');
    }

    this.requestInProgress = false;

    if(this.windowHidden){
      this.updateUnreadMessages(++this.missedCalls);
    }
  },

  loadMoreVideos: function(room){
    if(this.requestInProgress) return;

    this.requestInProgress = true;

    var action = {
      type: 'request:load',
      offset: this.views.roomsContainer[app.config.room].messages.getMessages().length,
      room: app.config.room
    };

    this.socket.send(JSON.stringify(action));

    console.log('load more videos!', this.views.roomsContainer[app.config.room].messages.getMessages().length);
  },

  handleVisibilityChange: function(){
    if(!document[utils.hiddenProp]){
      // shown
      this.windowHidden = false;
      document.title = this.config.title;
      this.missedCalls = 0;

    } else {
      // hidden
      this.windowHidden = true;

    }
  },

  updateUnreadMessages: function(num){
    document.title = '(' + num + ') ' + this.config.baseTitle;
  },

  subscribeUser: function(){
    this.config.subscribed.push(utils.getUserRoom());
    this.cookies.subscribed = this.config.subscribed;
    this.updateCookie(this.cookies);

    this.views.notifications.subscriptionUpdated(this.config.subscribed);
  },

  unsubscribeUser: function(){
    this.config.subscribed = _.without(this.config.subscribed, utils.getUserRoom());

    this.cookies.subscribed = this.config.subscribed;
    this.updateCookie(this.cookies);

    this.views.notifications.subscriptionUpdated(this.config.subscribed);
  },

  showSharingFor(id, room){
    this.views.roomsContainer[room].showSharingFor(id);
  }
}

// go
app.bootstrap();



