import view from './view';
import utils from '../utils';

var notifications = {};
Object.assign(notifications, view, {
  template: '<span class="notifications">' +
              '<span class="warn-message message"></span>' +
            '</span>',

  warnings: {
    'denied': ['Sorry, try again in a bit...', 'Woooah, chill! Try again in a sec', 'Woaaah, that\'s fast!', 'Too much coffee maybe? Try again in a sec', 'Let\'s try that again in a bit' ],
    'default': 'Sorry, an error occurred, please try again!'
  },

  warn: function(err){
    var self = this;

    var warnEl = this.el.find('.warn-message');

    if(this.theTimeout) {
      clearTimeout(this.theTimeout);
      this.theTimeout = null;
      warnEl.removeClass('in');
    }

    if(!warnEl.length) return;

    var msg = 'Sorry, an error occurred, please try again!';

    if(err && err.error){
      msg = this.getWarning(err.error);
    }

    warnEl
      .text(msg)
      .addClass('in');

    this.theTimeout = setTimeout(function(){
      warnEl.removeClass('in')
    }, 2750);

  },

  getWarning: function(key){
    if(this.warnings[key]){
      if(this.warnings[key].length){
        return this.warnings[key][ Math.floor(Math.random() * this.warnings[key].length) ];
      } else {
        return this.warnings[key];
      }
    } else {
      return this.warnings.default;
    }
  }

});

export default notifications;