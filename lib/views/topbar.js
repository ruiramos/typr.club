
import view from './view';
import utils from '../utils';
import $ from 'jquery';

var topbar = {};
Object.assign(topbar, view, {
  template: '<span class="content">' +
              '<a href= "/">Typr.</a> Send short messages with video, 8 seconds max. ' +
              '<span class="subtitle">Also with private room support, here\'s a random one: <a data-hook="rand-link" href=""></a></span>' +
            '<span data-hook="room" class="room"></span>' +
            '<span data-hook="clients" class="clients"></span>',

  render: function(){
    var self = this;

    this.renderDom();

    $.get('/english-nouns.json', function(words){
      var wordsArray = JSON.parse(words);

      var rand = utils.sample(wordsArray.adj) + '-' + utils.sample(wordsArray.nouns) + '-' + utils.sample(wordsArray.nouns);

      self.el.find('[data-hook=rand-link]')
        .attr('href', '/' + rand)
        .text(`${window.location.origin}/${rand}`);

      if(window.location.pathname !== '/'){
        self.el.find('.subtitle').hide();
        self.el.find('.room').text('Room: ' + window.location.pathname.slice(1));
      } else {
        self.el.find('.room').text('Room: World');
      }
    })
  },

  updateConnectedClients: function(clients){
    this.el.find('[data-hook=clients]').text(clients)
    this.el.find('[data-hook=clients]').append('<span class=""> connected</span>');
  }

})

export default topbar;