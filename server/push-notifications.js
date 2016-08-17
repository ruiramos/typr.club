var db = require('./db');
var secrets = require('./secrets');
var request = require('request');

var gcmUrl = 'https://android.googleapis.com/gcm/send';
/**
  Push notifications!

**/

var _lastNotification = {};

function _pushNotifications(ids, room){
  var data = {registration_ids: ids};

  request.post({
    url: gcmUrl,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      Authorization: 'key=' + secrets.gcm_key,
      'Content-Type': 'application/json'
    }
  });

  ids.forEach(function(subscription){
    _lastNotification[subscription] = {
      body: 'Click to open typr.club/'+room,
      title: 'New message on ' + room + '!',
      icon: '/typr-192.jpg',
      tag: 'new-message',
      room: room
    }
  })
}

module.exports = {
  notify: function(room, messages){
    db.getNotificationsIdForRoom(room, function(err, ids){
      db.filterUserIdsForNotifications(ids, messages, function(newIds){
        _pushNotifications(newIds, room);
      })
    })
  },

  getNotificationFromUser: function(subscription){
    return _lastNotification[subscription];
  }

}
