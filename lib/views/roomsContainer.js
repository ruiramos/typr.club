
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
                '<div class="empty-state" data-hook="empty-state">' +
                  '<h3>This room is empty!</h3>' +
                  '<p>And that\'s fine, they all start this way. You can now:</p>' +
                    '<ul>' +
                      '<li>Share this URL with your friends so they join in.</li>' +
                      '<li>Send the first message by writing anything in the text box on the left and hitting the <i>enter</i> key.</li>' +
                      '<li>You can then share them Slack, Facebook, etc, by hovering the messages and clicking the Share arrow.</li>' +
                    '</ul>' +
                    '<p>Have fun!</p>' +
                '</div>' +
              '</div>' +
            '</div>',

  initialize: function(){
    this.refs = {
      titleLink: this.el.find('[data-hook="room-link"]'),
      title: this.el.find('[data-hook="room-title"]'),
      connected: this.el.find('[data-hook="connected-clients"]'),
      emptyState: this.el.find('[data-hook="empty-state"]')
    }

    this.composer = composer.create({
      hook: this.el.find('[data-hook="composer-container"]'),
      recordOptions: app.config.recordOptions,
      room: this.room,
      maxRecordTime: 8 * 1000,
      fullscreen: this.fullscreen
    });

    this.messages = messages.create({
      hook: this.el.find('[data-hook="chat-container"]'),
      room: this.room,
      fullscreen: this.fullscreen
    });

    $(this).on('updated', () => $(this.messages).trigger('updated'));
  },

  render: function(){
    this.renderDom();

    this.composer.render();

    this.messages.render();

    if(!this.fullscreen){
      this.refs.titleLink.text(this.room);
      this.refs.titleLink.attr('href', '/' + this.room);
      this.refs.emptyState.remove();
    } else {
      this.refs.title.hide();
      this.showEmptyState();
    }
  },

  appendMessage: function(){
    this.messages.appendMessage.apply(this.messages, arguments);
    this.hideEmptyState();
  },

  prependMessage: function(){
    this.messages.prependMessage.apply(this.messages, arguments);
    this.hideEmptyState();
  },

  removeSelfies: function(){
    this.messages.removeSelfies();
  },

  addSelfie: function(){
    this.messages.addSelfie.apply(this.messages, arguments);
    this.hideEmptyState();
  },

  updateConnectedClients: function(clients){
    this.refs.connected.text(clients + ' connected');
  },

  showEmptyState: function(){
    if(!this._emptyState){
      var me = this;
      setTimeout(function(){
        me.refs.emptyState.css('opacity', 1);
      }, 1);
      this._emptyState = true;
    }
  },

  hideEmptyState: function(){
    if(this._emptyState){
      var me = this;
      setTimeout(function(){
        me.refs.emptyState.css('opacity', 0);
      }, 1);
      this._emptyState = false;
    }
  },

  setLikesInVideo: function(id, likes){
    this.messages.setLikesInVideo(id, likes);
  },

  showSharingFor: function(id){
    this.messages.showSharingFor(id);
  }

});

export default roomsContainer;
