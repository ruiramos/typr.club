import $ from 'jquery';
import api from './api';
import utils from './utils';

import composer from './views/composer';
import messages from './views/messages';
import topbar from './views/topbar';

var app = window.app = {
  bootstrap: function(){
    this.config = {
      recordOptions: {
        type: 'video'
      },
      room: window.location.pathname.replace('/', '') || 'world'
    };

    this.views = {
      composer: composer.create({hook: 'composer-container', recordOptions: this.config.recordOptions, room: this.config.room}),
      messages: messages.create({hook: 'chat-container'}),
      topbar:   topbar.create({hook: 'top-bar'})
    };

    $(this.views.messages).on('request:load', this.loadMoreVideos.bind(this));

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
      // array - initial load
      data = data.reverse();

      data.forEach((d) => {
        this.views.messages.appendMessage(d.video, d.text, true);
      });

      $(this.views.messages).trigger('updated');

    } else {
      // object - something someone send, to prepend
      this.views.messages.prependMessage(data.video, data.text);
    }

    this.requestInProgress = false;
  },

  loadMoreVideos: function(){
    if(this.requestInProgress) return;

    this.requestInProgress = true;

    var action = {
      type: 'request:load',
      offset: this.views.messages.getMessages().length
    };

    this.socket.send(JSON.stringify(action));

    console.log('load more videos!');
  }
}

// go
app.bootstrap();



