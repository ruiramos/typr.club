import $ from 'jquery';
import cookie from 'cookie';
import uuid from 'uuid';
import _ from 'lodash';


import api from './api';
import utils from './utils';

// import composer from './views/composer';
// import messages from './views/messages';

import roomsContainer from './views/roomsContainer';
import topbar from './views/topbar';
import notifications from './views/notifications';


var app = window.app = {
  bootstrap: function(){
    if(window.location.search.indexOf('render') > -1) return;
    this.initCookies();

    this.config = {
      recordOptions: {
        type: 'video'
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
      notifications : notifications.create({hook: 'notifications'})
    };

    this.config.room.split(',').forEach(function(room){
      this.views.roomsContainer[room] = roomsContainer.create({
        hook: 'rooms',
        room: room,
        fullscreen: !utils.userInDashboard()
      });
    }, this);

    app.warn = this.views.notifications.warn.bind(this.views.notifications);

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
      return subscribed && subscribed.length ? subscribed.join(',') : 'world';
    }
  },

  createSocket: function(){
    // connecting to the websocket
    this.socket = new WebSocket("ws://"+window.location.hostname+":8008/" + this.config.room);
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
      }
    };
  },

  addMessageFromWs: function(data, room, loadRequest){
    //var data = JSON.parse(eventData);

    loadRequest && data.reverse();

    data.forEach((d) => {
      loadRequest ?
        this.views.roomsContainer[room].appendMessage(d.video, d.text, true, d) :
        this.views.roomsContainer[room].prependMessage(d.video, d.text, true, d);
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
  },

  unsubscribeUser: function(){
    this.config.subscribed = _.without(this.config.subscribed, utils.getUserRoom());

    this.cookies.subscribed = this.config.subscribed;
    this.updateCookie(this.cookies);
  }
}

// go
app.bootstrap();



