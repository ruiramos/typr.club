
var fs = require('fs'),
    db = require('./db'),
    path = require('path');
    url = require('url'),
    secrets = require('./secrets'),
    io = require('./io'),
    push = require('./push-notifications'),
    AWS = require('aws-sdk'),
    phantom = require('phantom'),
    Handlebars = require('handlebars');


var filePathBase = './uploads/';
var s3 = new AWS.S3({region: 'eu-west-1'});
var serverWebmFilePath = 'https://files-webm.typr.club/';

process.env.AWS_ACCESS_KEY_ID = secrets.s3_key;
process.env.AWS_SECRET_ACCESS_KEY = secrets.s3_secret;

function home(response, _, request){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

    var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
    response.end(template({
      homePage: true,
      ogImageUrl: 'https://typr.club/screenshot.png'
    }));
}

function help(response, _, request){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

    var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
    response.end(template({
      helpPage: true,
      ogImageUrl: 'https://typr.club/screenshot.png'
    }));
}

function room(response, _, request){
  if(_getQueryObject(request).render){
    roomWithRender(response, _, request);
    return;

  } else {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });

    var pathName = url.parse(request.url).pathname.slice(1);

    var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
    response.end(template({
      currentRoom: pathName,
      ogImageUrl: pathName ? 'https://typr.club/thumb?id=' + pathName : 'https://typr.club/screenshot.png'
    }));
  }
};

function roomWithRender(response, _, request){
  var room = url.parse(request.url).pathname.slice(1);
  var data = {};

    db.getWithOffset(room, 0, function(res){
      response.writeHead(200, {'Content-Type': 'text/html'});

      res.forEach(function(r){
        var id = r.video.slice(r.video.lastIndexOf('/'), r.video.lastIndexOf('.'));
        r.poster = 'http://s3-eu-west-1.amazonaws.com/files-mp4.typr.club' +id+ '.png'
      })

      var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
      response.end(template({res: res.reverse(), currentRoom: room}));
    })
};

function pp(response){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

  response.end(fs.readFileSync(path.resolve(__dirname, '../privacy-policy.html'), "utf-8"));
};

function api(response, data, request){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

  var queryObject = _getQueryObject(request);

  if(queryObject.key === secrets.key){
    if(queryObject.remove){
      db.remove(queryObject.remove.split(','), queryObject.room || 'world', queryObject.number)
    }

    response.end('ok');

  } else {
    response.end('auth failed');
  }

}

function upload(response, postData, request){
  var content = JSON.parse(postData);
  var ip = request.connection.remoteAddress;
  var room = content.room;

  if(!db.canUserPost(content.uuid, room, ip, function(canPost){
    if(!canPost){
      response.statusCode = 403;
      response.writeHead(403, {
          'Content-Type': 'application/json'
      });

      response.end(JSON.stringify({error: 'denied'}));

    } else {
      db.setUserLock(content.uuid, room, ip);

      _upload(response, content.video, function(data){

        if(!data){
          // upload failed
          response.statusCode = 500;
          response.end();

        } else {
          var message = {
            type: 'message:new',
            data: {
              id: data.Location.substring(data.Location.lastIndexOf('/') + 1, data.Location.lastIndexOf('.')),
              video: data.Location,
              text: content.text,
              uuid: content.uuid
            }
          };

          db.save(message.data, room);
          io.broadcastDelayed(message, room)

          response.statusCode = 200;
          response.writeHead(200, {
              'Content-Type': 'application/json'
          });

          response.end(message.data.video);
        }
      });
    };
  }));

};

function thumb(response, _, request){
  var id = _getQueryObject(request).id;
  var filename = path.resolve(__dirname, './thumbnails/' + id + '_thumb.jpg');

  phantom.create({parameters: {'ignore-ssl-errors': 'yes', 'load-images': 'yes', 'local-to-remote-url-access': 'yes'}}, function(ph) {
    return ph.createPage(function(page) {
      page.setViewportSize(1200, 630);
      page.set('clipRect', {top: 0, left: 0, width: 1200, height: 630});

      return page.open("https://typr.club/"+id+"?render=true", function(status) {
        setTimeout(function(){
          page.evaluate(function () { document.body.bgColor = 'white'; return document.body; }, function (result) {
            page.render(filename, {quality: 90}, function(image){
              response.writeHead(200, {'Content-Type': 'image/jpeg'});
              response.end(fs.readFileSync(filename));
              ph.exit();
            });
          });

        }, 2100);
      });
    });
  })
};

function serveStatic(response, pathname, postData){
  var extension = pathname.split('.').pop(),
      extensionTypes = {
        'js': 'application/javascript',
        'webm': 'video/webm',
        'mp4': 'video/mp4',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'gif': 'image/gif',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'css': 'text/css',
        'eot': 'application/vnd.ms-fontobject',
        'woff2': 'application/font-woff2',
        'ttf': 'application/octet-stream',
      };

  response.writeHead(200, {
      'Content-Type': extensionTypes[extension]
  });

  try {
    if (hasMediaType(extensionTypes[extension]))
        response.end(fs.readFileSync(path.resolve(__dirname, '.' + pathname)));
    else
        response.end(fs.readFileSync(path.resolve(__dirname, '..' + pathname)));
  } catch (e){
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end();
  }
};

function hasMediaType(type) {
    var isHasMediaType = false;
    ['audio/wav', 'audio/ogg', 'video/webm', 'video/mp4'].forEach(function(t) {
      if(t == type) isHasMediaType = true;
    });

    return isHasMediaType;
};

function _upload(response, file, fn) {
    var fileRootName = file.name.split('.').shift(),
        fileExtension = file.name.split('.').pop();

    file.contents = file.contents.split(',').pop();

    var params = {
      Key: fileRootName + '.' + fileExtension,
      ContentType: 'video/webm',
      Bucket: 'files-webm.typr.club',
      Body: new Buffer(file.contents, "base64")
    };

    s3.upload(params)
      .send(function(err, data) {
        if(err){
          console.log('Upload error:', err);
          fn(false);
        } else {
          fn(data);
        }
      });
}

function _getQueryObject(request){
  var query = url.parse(request.url).query,
      queryObject = {};

  if(!query) return queryObject;

  query.split('&').forEach(function(op){
    var obj = op.split('=');
    queryObject[obj[0]] = obj[1] || true;
  })

  return queryObject;
}

function subscription(response, postData, request){
  var gcmServer = 'https://android.googleapis.com/gcm/send/';

  var data = JSON.parse(postData);
  var id = data.endpoint.split(gcmServer)[1];

  db.updateUserRegistration(id, data.rooms, data.uuid);

  response.end('ok')
}

function getNotification(response, postData, request){
  var endpoint = JSON.parse(postData).endpoint;
  if(!endpoint) return;

  var rId = endpoint.slice(endpoint.lastIndexOf('/') + 1);
  var msg = push.getNotificationFromUser(rId);

  response.end(JSON.stringify({
    body: msg.body,
    title: msg.title,
    icon: msg.icon,
    tag: msg.tag,
    room: msg.room,
    data: msg.data,
  }))
}

function getTextForId(response, _, request){
  var id = _getQueryObject(request).id;
  if(!id){
    response.end('no-id');
  } else {
    db.getTextForId(id, function(err, data){
      response.end(data);
    })
  }
}

module.exports = {
  home: home,
  room: room,
  help: help,
  pp: pp,
  api: api,
  upload: upload,
  thumb: thumb,
  subscription: subscription,
  getTextForId: getTextForId,
  getNotification: getNotification,
  serveStatic: serveStatic
}
