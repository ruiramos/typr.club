import $ from 'jquery';
import api from './api';
import utils from './utils';

import composer from './views/composer';
import messages from './views/messages';

var app = window.app = {
  bootstrap: function(){
    this.config = {
      maxVideos: 40,
      recordOptions: {
        type: 'video'
      },
      room: window.location.pathname.replace('/', '') || 'world'
    };

    this.views = {
      composer: composer.create({hook: 'composer-container', recordOptions: this.config.recordOptions, room: this.config.room}),
      messages: messages.create({maxVideos: this.config.maxVideos, hook: 'chat-container'})
    };

    // connecting to the websocket
    this.socket = new WebSocket("ws://"+window.location.hostname+":8008/" + this.config.room);
    this.socket.onmessage = (event) => {
      this.addMessageFromWs(event);
    };

    this.renderApp();

    return this;
  },

  renderApp: function(){
    Object.keys(this.views).forEach((view) => this.views[view].render())
  },

  addMessageFromWs: function(event){
    var data = JSON.parse(event.data);

    if(data.length){
      // restricting to maxVideos
      if(data.length > this.maxVideos){
        data.splice(0, data.length - this.maxVideos);
      }

      data.forEach((d) => {
        this.views.messages.addMessage(d.video, d.text);
      });

    } else {
      this.views.messages.addMessage(data.video, data.text);
    }
  }
}

// go
app.bootstrap();



