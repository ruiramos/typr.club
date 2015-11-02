import $ from 'jquery';

var view = {
  create: function(config){
    var me = Object.create(this);

    $.extend(me, config);
    me.el = $(me.template);

    if(me.initialize){
      me.initialize(config);
    }

    me._processEvents(me.events || {});

    return me;
  },

  _processEvents: function(evts){
    Object.keys(evts).forEach((evt) => {
      var split = evt.split(' '),
          e = split[0],
          el = split[1],
          fn = this[evts[evt]].bind(this);

      if(el.match(/^[\.|#|\[].+/)){
        this.el.on(e, el, fn);
      } else if(el === 'window'){
        $(window).on(e, fn);
      } else {
        $(el).on(e, fn);
      }

    });
  },

  render: function(){
    this.renderDom();
    $(this).trigger('rendered');
    return this;
  },

  renderDom: function(){
    this.getContainer().append(this.el);
  },

  getContainer: function(){
    if(typeof this.hook === 'string'){
      return $('[data-hook="' + this.hook + '"]');
    } else {
      return this.hook;
    }
  }
}

export default view;