import Api from './api';

// generating random string
function generateRandomString() {
    if (window.crypto) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
};

function sample(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

function userInRoom(){
  return window.location.pathname !== '/';
}

function getUserRoom(){
  return window.location.pathname.slice(1);
}

function userSubscribedToCurrentRoom(){
  var room = this.getUserRoom();
  return app.config.subscribed.indexOf(room) > -1;
}

function userInDashboard(){
  return !this.userInRoom() && app.config.room !== 'world'
}

function saveSubscriptionEndpoint(subscription, rooms){
  var endpoint = subscription.endpoint;
  if(!endpoint){
    console.warn('Tried to save subscription endpoint but no endpoint found', subscription);
    return;
  }

  Api.saveSubscription(endpoint, rooms);

}

///-- polyfills

// Object.assign polyfill
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

var hiddenProp,
    visibilityChange;

if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hiddenProp = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hiddenProp = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hiddenProp = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hiddenProp = "webkithiddenProp";
  visibilityChange = "webkitvisibilitychange";
};

var utils = {
  sample,
  generateRandomString,
  visibilityChange,
  hiddenProp,

  userInRoom,
  userSubscribedToCurrentRoom,
  getUserRoom,
  userInDashboard,

  saveSubscriptionEndpoint,

};

export default utils;