
import view from './view';
import utils from '../utils';

var topbar = {};
Object.assign(topbar, view, {
  template: '<span/>',

  render: function(){
    var rand = utils.generateRandomString().substr(0, 6);
    this.el.html(`<strong>An app with videos and chat.</strong> Now with private rooms support! Try a random one: <a href="/${rand}">${window.location.origin}/${rand}</a>`);
    this.renderDom();
  }

})

export default topbar;