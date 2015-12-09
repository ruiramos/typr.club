import $ from 'jquery';

var view = {
  create: function(config){
    var me = Object.create(this);

    $.extend(me, config);
    me.el = $(me.template);

    me._initializeProps(me.props);
    me._initializeBindings(me.bindings);

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

  _initializeProps: function(props){
    if(!props) return;
    this._props = {};

    props.forEach(function(key){
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: function(){
          return this._props[key];
        },
        set: function(val){
          this._props[key] = val;
          if(this._bindings[key]){
            if(typeof this.bindings[key] === 'object' && this.bindings[key] instanceof Array){
              // array... for each
              this.bindings[key].forEach(function(bindingObj){
                this._updateBinding(bindingObj, val);
              }, this)
            } else {
              this._updateBinding(this._bindings[key], val);
            }
          }
        }
      });
    }, this);
  },

  _initializeBindings: function(bindings){
    this._bindings = bindings || {};
  },

  _updateBinding(binding, value){
    var el = binding.hook ?
      this.el.find('[data-hook='+ binding.hook +']') :
      binding.selector ?
        this.el.find(binding.selector) : this.el;

    if(!el){
      console.warn('Couldn\'t find element for binding!', binding);
      return;
    }


    if(binding.type === 'attribute'){
      el.attr(binding.attribute, value);
    } else if(binding.type === 'toggle'){
      value ? el.show() : el.hide();
    } else if(binding.type === 'toggleClass'){
      if(value){
        el.removeClass(binding.no)
          .addClass(binding.yes);
      } else {
        el.removeClass(binding.yes)
          .addClass(binding.no);
      }
    } else {
      el.text(value);
    }
  },

  render: function(){
    this.renderDom();
    this.renderBindings();

    $(this).trigger('rendered');

    return this;
  },

  renderBindings: function(){
    Object.keys(this._bindings).forEach(function(key){
      var binding = this._bindings[key];
      if(binding instanceof Array){
        binding.forEach((b) => this._updateBinding(b, this._props[key]));
      } else {
        this._updateBinding(binding, this._props[key]);
      }
    }, this)
  },

  renderDom: function(){
    if(this.hook)
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