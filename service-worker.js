/**

  The service worker responsible for the notifications.
  Initialized in app.js, after the app renders.

**/

self.addEventListener('push', function(event) {
  console.log('Received a push message', event, event.endpoint);

  event.waitUntil(
    self.registration.pushManager.getSubscription().then(function(subscription){
      console.log(subscription, arguments)
      fetch('/api/getNotification', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(function(response){
        return response.json();
      })
      .then(function(data){
        var title = data.title;
        var body = data.body;
        var icon = data.icon;
        var tag = data.tag;
        var room = data.room;

        return self.registration.showNotification(title, {
          body: body,
          icon: icon,
          tag: tag,
          data: {
            room: room
          }
        })

      })
      .catch(function(err){
        console.log('Service Worker error:' + err);
      })
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  var room = event.notification.data.room;
  console.log('room is', room);
  clients.openWindow('/'+room);
});

