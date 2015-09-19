import view from './view';
import utils from '../utils';

var notifications = {};
Object.assign(notifications, view, {
  template: '<span class="notifications">' +
              '<span class="warn-message message"></span>' +
            '</span>',

  warn: function(err){
    var warnEl = this.el.find('.warn-message');

    if(!warnEl.length) return;

    var msg = 'Sorry, an error occurred, please try again!';

    if(err && err.error === 'denied'){
      msg = 'Sorry, try again in a bit...';
    }

    warnEl
      .text(msg)
      .addClass('in');

    setTimeout(function(){
      warnEl.removeClass('in')
    }, 2750);

  }

});

export default notifications;