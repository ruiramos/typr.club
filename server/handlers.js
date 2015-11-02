
var fs = require('fs'),
    db = require('./db'),
    path = require('path');
    url = require('url'),
    secrets = require('./secrets'),
    io = require('./io'),
    AWS = require('aws-sdk'),
    phantom = require('phantom'),
    Handlebars = require('handlebars');


var filePathBase = './uploads/';
var s3 = new AWS.S3({region: 'eu-west-1'});

process.env.AWS_ACCESS_KEY_ID = secrets.s3_key;
process.env.AWS_SECRET_ACCESS_KEY = secrets.s3_secret;

function home(response, _, request){
  if(_getQueryObject(request).render){
    homeWithRender(response, _, request);

  } else {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });

    var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
    response.end(template({currentRoom: 'world'}));
  }
};

function homeWithRender(response, _, request){
  var room = url.parse(request.url).pathname.slice(1);
  var data = {};

    db.getWithOffset(room, 0, function(res){
      response.writeHead(200, {'Content-Type': 'text/html'});

      res.forEach(function(r){
        r.poster = r.video.replace('webm', 'png').replace('typr.club', 'typr.club-mp4');
      })

      var template = Handlebars.compile(fs.readFileSync(path.resolve(__dirname, '../index.html'), "utf-8"));
      response.end(template({res: res, currentRoom: room}));
    })
};

function api(response, data, request){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

  var queryObj = _getQueryObj(request);

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
  var filename = path.resolve(__dirname, './thumbnails/' + id + '_thumb.png');

  phantom.create(function(ph) {
    return ph.createPage(function(page) {
      page.setViewportSize(1024, 768);
      return page.open("http://typr.club/"+id+"?render=true", function(status) {
        setTimeout(function(){
          page.evaluate(function () { return document.body; }, function (result) {
            page.render(filename, function(image){
              response.writeHead(200, {
                  'Content-Type': 'image/png'
              });
              response.end(fs.readFileSync(filename));
            });
          });

        }, 500);
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
        'png': 'image/png'
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
      Bucket: 'typr.club',
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


module.exports = {
  home: home,
  api: api,
  upload: upload,
  thumb: thumb,
  serveStatic: serveStatic
}

