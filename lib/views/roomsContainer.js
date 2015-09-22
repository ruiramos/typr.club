
import view from './view';

import messages from './messages';
import composer from './composer';

var roomsContainer = {};

Object.assign(roomsContainer, view, {
  template: '<div class="room-container">' +
              '<span class="room-title" data-hook="room-title">' +
                '<a href="" data-hook="room-link"></a>' +
                '<span data-hook="connected-clients" class="connected-clients"></span>'+
              '</span>' +
              '<div class="inline-hack">' +
                '<div class="composer-container" data-hook="composer-container"></div>' +
                '<div class="chat-container" data-hook="chat-container"></div>' +
              '</div>' +
            '</div>',

  initialize: function(){
    this.refs = {
      titleLink: this.el.find('[data-hook="room-link"]'),
      title: this.el.find('[data-hook="room-title"]'),
      connected: this.el.find('[data-hook="connected-clients"]')
    }

    this.composer = composer.create({
      hook: this.el.find('[data-hook="composer-container"]'),
      recordOptions: app.config.recordOptions,
      room: this.room,
      maxRecordTime: 8 * 1000
    });

    this.messages = messages.create({
      hook: this.el.find('[data-hook="chat-container"]'),
      fullscreen: this.fullscreen
    })

    $(this).on('updated', () => $(this.messages).trigger('updated'));
  },

  render: function(){
    this.renderDom();

    this.composer.render();

    this.messages.render();

    if(!this.fullscreen){
      this.refs.titleLink.text(this.room);
      this.refs.titleLink.attr('href', '/' + this.room);
    } else {
      this.refs.title.hide();
    }

  },

  appendMessage: function(){
    this.messages.appendMessage.apply(this.messages, arguments);
  },

  prependMessage: function(){
    this.messages.prependMessage.apply(this.messages, arguments);
  },

  removeSelfies: function(){
    this.messages.removeSelfies();
  },

  addSelfie: function(){
    this.messages.addSelfie.apply(this.messages, arguments);
  },

  updateConnectedClients: function(clients){
    this.refs.connected.text(clients + ' connected');
  }

});

export default roomsContainer;
