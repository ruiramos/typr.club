import view from './view';
import utils from '../utils';

var notifications = {};
Object.assign(notifications, view, {
  template: '<span/>',
  _isPushEnabled: 0,
    // -1: denied
    //  0: not supported
    //  1: enabled

  initialize: function(){
    console.log('notifications initialize')
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
      .then(this.initializeNotifications.bind(this))
      .then(function(){
        if(navigator.serviceWorker.controller)
          navigator.serviceWorker.controller.postMessage(JSON.stringify({uuid: app.config.uuid}));
      })
    } else {
      console.warn('Service workers aren\'t supported in this browser.');
    }
  },

  getPushEnabled: function(){ return _isPushEnabled; },

  initializeNotifications: function(){
    var that = this;
    console.log('initializeNotifications')

    // Are Notifications supported in the service worker?
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
      console.warn('Notifications aren\'t supported.');
      this._isPushEnabled = 0; // not supported
      return;
    }

    // Check the current Notification permission.
    // If its denied, it's a permanent block until the
    // user changes the permission
    if (Notification.permission === 'denied') {
      console.warn('The user has blocked notifications.');
      this._isPushEnabled = -1; // denied
      return;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.warn('Push messaging isn\'t supported.');
      this._isPushEnabled = 0;
      return;
    }

    // We need the service worker registration to check for a subscription
    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
      // Do we already have a push message subscription?
      serviceWorkerRegistration.pushManager.getSubscription()
        .then(function(subscription) {
          // Enable any UI which subscribes / unsubscribes from
          // push messages.
          // var pushButton = document.querySelector('.js-push-button');
          // pushButton.disabled = false;

          if (!subscription) {
            // We aren't subscribed to push, so set UI
            // to allow the user to enable push
            if(app.getSubscribed().length){
              that.subscribe(app.getSubscribed());
            }
            return;
          }

          console.log('Saved subscription ok', subscription)

          // Keep your server in sync with the latest subscriptionId
          that.subscription = subscription;
          that.sendSubscriptionToServer(subscription, app.getSubscribed());

          // Set your UI to show they have subscribed for
          // push messages
          // pushButton.textContent = 'Disable Push Messages';
          that._isPushEnabled = 1;
        })
        .catch(function(err) {
          console.warn('Error during getSubscription()', err);
        });
    });
  },

  sendSubscriptionToServer: function(subscription, rooms){
    utils.saveSubscriptionEndpoint(subscription, rooms);
  },

  subscribe: function(rooms) {
    var that = this;
    // Disable the button so it can't be changed while
    // we process the permission request
    // var pushButton = document.querySelector('.js-push-button');
    // pushButton.disabled = true;

    navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
      serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
        .then(function(subscription) {
          // The subscription was successful
          that._isPushEnabled = true;
          console.log('subscription successful!!')
          // pushButton.textContent = 'Disable Push Messages';
          // pushButton.disabled = false;

          // TODO: Send the subscription.endpoint to your server
          // and save it to send a push message at a later date
          return that.sendSubscriptionToServer(subscription, rooms);
        })
        .catch(function(e) {
          if (Notification.permission === 'denied') {
            // The user denied the notification permission which
            // means we failed to subscribe and the user will need
            // to manually change the notification permission to
            // subscribe to push messages
            console.warn('Permission for Notifications was denied');
            that._isPushEnabled = -1;
          } else {
            // A problem occurred with the subscription; common reasons
            // include network errors, and lacking gcm_sender_id and/or
            // gcm_user_visible_only in the manifest.
            console.error('Unable to subscribe to push.', e);
            that._isPushEnabled = 0;
            // pushButton.disabled = false;
            // pushButton.textContent = 'Enable Push Messages';
          }
        });
    });
  },

  sendMessage: function(message) {
    // This wraps the message posting/response in a promise, which will resolve if the response doesn't
    // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
    // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
    // a convenient wrapper.
    return new Promise(function(resolve, reject) {
      var messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      // This sends the message data as well as transferring messageChannel.port2 to the service worker.
      // The service worker can then use the transferred port to reply via postMessage(), which
      // will in turn trigger the onmessage handler on messageChannel.port1.
      // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  },

  subscriptionUpdated: function(rooms){
    if(!this._isPushEnabled){
      this.subscribe(rooms);
    } else {
      if(this._isPushEnabled === 1){
        this.sendSubscriptionToServer(this.subscription, rooms)
      }
    }
  }

});

export default notifications;