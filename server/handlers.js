
var fs = require('fs'),
    db = require('./db'),
    path = require('path');
    url = require('url'),
    secrets = require('./secrets'),
    io = require('./io');

var filePathBase = './uploads/';

function home(response){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });
  response.end(fs.readFileSync(path.resolve(__dirname, '../index.html')));
};

function api(response, data, request){
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

  var query = url.parse(request.url).query,
      queryObject = {};
  query.split('&').forEach(function(op){
    var obj = op.split('=');
    queryObject[obj[0]] = obj[1];
  })

  if(queryObject.key === secrets.key){
    if(queryObject.remove){
      db.remove(queryObject.remove.split(','), queryObject.room || 'world', queryObject.number)
    }

    response.end('ok');

  } else {
    response.end('auth failed');
  }


}

function upload(response, postData){
  var content = JSON.parse(postData);

  _upload(response, content.video);

  var message = {
    video: filePathBase.replace('.', '') + content.video.name,
    text: content.text
  };

  db.save(message, content.room);
  io.broadcast(message, content.room)

  response.statusCode = 200;
  response.writeHead(200, {
      'Content-Type': 'application/json'
  });
  response.end(content.video.name);

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

function _upload(response, file) {
    var fileRootName = file.name.split('.').shift(),
        fileExtension = file.name.split('.').pop(),
        fileRootNameWithBase = path.resolve(__dirname, filePathBase) + '/' + fileRootName,
        filePath = fileRootNameWithBase + '.' + fileExtension,
        fileID = 2,
        fileBuffer;

    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }

    file.contents = file.contents.split(',').pop();

    fileBuffer = new Buffer(file.contents, "base64");

    fs.writeFileSync(filePath, fileBuffer);
}

module.exports = {
  home: home,
  api: api,
  upload: upload,
  serveStatic: serveStatic
}

