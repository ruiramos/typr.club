
import view from './view';
import utils from '../utils';
import $ from 'jquery';

var topbar = {};
Object.assign(topbar, view, {
  template: '<span class="content">' +
              '<span class="title">' +
                '<a href= "/" class="typr">Typr.</a> Send short messages with video, 8 seconds max. ' +
                '<span class="subtitle">Also with private room support, here\'s a random one: <a data-hook="rand-link" href=""></a></span>' +
              '</span>' +
              '<span class="pull-right">' +
                '<span data-hook="room" class="room"></span>' +
                '<span data-hook="clients" class="clients"></span>' +
                '<button data-hook="subscribe-btn" class="subscribe-btn hide">Subscribe</button>' +
              '</span>' +
            '</span>',

  events: {
    'click [data-hook="subscribe-btn"]': 'handleSubscribeButton'
  },

  initialize: function(){
    this.refs = {
      subscribeBtn: this.el.find('[data-hook="subscribe-btn"]'),
      room: this.el.find('[data-hook="room"]'),
      clients: this.el.find('[data-hook="clients"]'),
    };
  },

  render: function(){
    var self = this;

    this.renderDom();

    $.get('/english-nouns.json', function(words){
      var wordsArray = JSON.parse(words);

      var rand = utils.sample(wordsArray.adj) + '-' + utils.sample(wordsArray.nouns) + '-' + utils.sample(wordsArray.nouns);

      self.el.find('[data-hook=rand-link]')
        .attr('href', '/' + rand)
        .text(`${window.location.origin}/${rand}`);

      if(utils.userInRoom()){
        self.el.find('.subtitle').hide();
        self.refs.room.text('Room: ' + window.location.pathname.slice(1));

        if(utils.userSubscribedToCurrentRoom()){
          self.refs.subscribeBtn.addClass('active');
          self.refs.subscribeBtn.text('Subscribed');
        }

        self.refs.subscribeBtn.show();

      } else if(utils.userInDashboard()){
        self.refs.room.hide();
        self.refs.clients.hide();
      } else {
        self.refs.room.text('Room: World');
      }
    })
  },

  handleSubscribeButton: function(){
    if(utils.userSubscribedToCurrentRoom()){
      app.unsubscribeUser();

      this.refs.subscribeBtn.removeClass('active');
      this.refs.subscribeBtn.text('Subscribe');

    } else {
      app.subscribeUser();

      this.refs.subscribeBtn.addClass('active');
      this.refs.subscribeBtn.text('Subscribed');
    }

  },

  updateConnectedClients: function(clients){
    this.el.find('[data-hook=clients]').text(clients)
    this.el.find('[data-hook=clients]').append('<span class=""> connected</span>');
  }

})

export default topbar;