import $ from 'jquery';

var view = {
  create: function(config){
    var me = Object.create(this);

    $.extend(me, config);
    me.el = $(me.template);
    me._processEvents(me.events || {});

    if(me.initialize){
      me.initialize(config);
    }

    return me;
  },

  _processEvents: function(evts){
    Object.keys(evts).forEach((evt) => {
      var split = evt.split(' '),
          e = split[0],
          el = split[1],
          fn = this[evts[evt]].bind(this);

      this.el.on(e, el, fn);

    });
  },

  render: function(){
    this.renderDom();
  },

  renderDom: function(){
    $('[data-hook="' + this.hook + '"]').append(this.el);
  }
}

export default view;