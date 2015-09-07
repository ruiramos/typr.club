
import view from './view';
import utils from '../utils';

var topbar = {};
Object.assign(topbar, view, {
  template: '<span/>',

  render: function(){
    var rand = utils.generateRandomString().substr(0, 6);
    this.el.html(`<strong>Typr.</strong> Send shorts messages with video. 8 seconds max. <span>Now with private rooms support! Try a random one: <a href="/${rand}">${window.location.origin}/${rand}</a></span>`);
    this.renderDom();
  }

})

export default topbar;