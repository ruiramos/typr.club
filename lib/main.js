import $ from 'jquery';
import cookie from 'cookie';
import uuid from 'uuid';


import api from './api';
import utils from './utils';

import composer from './views/composer';
import messages from './views/messages';
import topbar from './views/topbar';
import notifications from './views/notifications';


var app = window.app = {
  bootstrap: function(){
    this.config = {
      recordOptions: {
        type: 'video'
      },
      room: window.location.pathname.replace('/', '') || 'world',
      uuid: this.getUuid(),
      title: '~ typr.club',
      baseTitle: 'typr.club'
    };

    this.missedCalls = 0;

    this.views = {
      composer: composer.create({
        hook: 'composer-container',
        recordOptions: this.config.recordOptions,
        room: this.config.room,
        maxRecordTime: 8 * 1000
      }),
      messages: messages.create({hook: 'chat-container'}),
      topbar:   topbar.create({hook: 'top-bar'}),
      notifications : notifications.create({hook: 'notifications'})
    };

    app.warn = this.views.notifications.warn.bind(this.views.notifications);
    app.addSelfie = this.views.messages.addSelfie.bind(this.views.messages);

    $(this.views.messages).on('request:load', this.loadMoreVideos.bind(this));

    document.addEventListener(utils.visibilityChange, this.handleVisibilityChange.bind(this), false);

    this.createSocket();
    this.renderApp();

    return this;
  },

  renderApp: function(){
    Object.keys(this.views).forEach((view) => this.views[view].render())
  },

  getUuid: function(){
    var cookies = cookie.parse(document.cookie);
    if(cookies.typrData){
      return JSON.parse(cookies.typrData).uuid;
    } else {
      var myuuid = uuid.v1();
      var nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      document.cookie = cookie.serialize('typrData', JSON.stringify({
        uuid: myuuid
      }), {
        path: '/',
        expires: nextYear
      });

      return myuuid;
    }
  },

  createSocket: function(){
    // connecting to the websocket
    this.socket = new WebSocket("ws://"+window.location.hostname+":8008/" + this.config.room);
    this.socket.onmessage = (evt) => {
      var event = JSON.parse(evt.data);
      switch(event.type){
        case 'message:load':
          this.addMessageFromWs(event.data, true);
          break;

        case 'message:new':
          this.addMessageFromWs(event.data);
          break;

        case 'presence':
          this.views.topbar.updateConnectedClients(event.data.clients)
          break;
      }
    };
  },

  addMessageFromWs: function(data, loadRequest){
    //var data = JSON.parse(eventData);

    loadRequest && data.reverse();

    this.views.messages.removeSelfies();

    data.forEach((d) => {
      loadRequest ?
        this.views.messages.appendMessage(d.video, d.text, true) :
        this.views.messages.prependMessage(d.video, d.text, true);
    });

    if(data.length)
      $(this.views.messages).trigger('updated');

    this.requestInProgress = false;

    if(this.windowHidden){
      this.updateUnreadMessages(++this.missedCalls);
    }
  },

  loadMoreVideos: function(){
    if(this.requestInProgress) return;

    this.requestInProgress = true;

    var action = {
      type: 'request:load',
      offset: this.views.messages.getMessages().length
    };

    this.socket.send(JSON.stringify(action));

    console.log('load more videos!', this.views.messages.getMessages().length);
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
  }
}

// go
app.bootstrap();



