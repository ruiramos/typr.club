/**

  The service worker responsible for the notifications.
  Initialized in app.js, after the app renders.

**/


self.addEventListener('push', function(event) {
  console.log('Received a push message', event, event.endpoint);

  event.waitUntil(
    self.registration.pushManager.getSubscription().then(
      function(subscription){

        return clients.matchAll({
            type: "window"
          }).then(function(clientList) {

            if(clientList[0] && clientList[0].focused) return Promise.reject('focused');

            return fetch('/api/getNotification', {
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
          .catch(function(err){
            console.log('window was focused!', err);
          })
      }
    )
  );
});

self.addEventListener('notificationclick', function(event) {
  var room = event.notification.data.room;
  console.log('room is', room);

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      console.log(client.url)
      if (client.url.indexOf('/'+room) > -1 && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow('/'+room);
  }));

});

// self.addEventListener('message', function(event) {
//   var data = JSON.parse(event.data);
//   if(!data) return;
//   if(data.uuid){ uuid = data.uuid; }
// })

