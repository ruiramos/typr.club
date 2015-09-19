
import view from './view';
import utils from '../utils';

var topbar = {};
Object.assign(topbar, view, {
  template: '<span class="content">' +
              '<a href= "/">Typr.</a> Send short messages with video, 8 seconds max. ' +
              '<span class="subtitle">Also with private room support, here\'s a random one: <a data-hook="rand-link" href=""></a></span>' +
            '<span data-hook="clients" class="clients"></span>',

  render: function(){
    this.renderDom();

    var rand = utils.generateRandomString().substr(0, 6);
    this.el.find('[data-hook=rand-link]')
      .attr('href', '/' + rand)
      .text(`${window.location.origin}/${rand}`);

    if(window.location.pathname !== '/'){
      this.el.find('.subtitle').hide();
    }
  },

  updateConnectedClients: function(clients){
    this.el.find('[data-hook=clients]').text(clients)
    this.el.find('[data-hook=clients]').append('<span class=""> connected</span>');
  }

})

export default topbar;