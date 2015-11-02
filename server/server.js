var http = require('http'),
    url = require('url'),
    io = require('./io'),
    path = require('path');
    config = {
      port: 8000,
      wsPort: 8008,
      upload_dir: path.resolve(__dirname, './uploads'),

      s3: {
          key: '',
          secret: '',
          bucket: ''
      },

      s3_enabled: false
    }

function start(route, handle) {

    function onRequest(request, response) {

        var pathname = url.parse(request.url).pathname,
            postData = '';

        request.setEncoding('utf8');

        request.addListener('data', function(postDataChunk) {
            postData += postDataChunk;
        });

        request.addListener('end', function() {
            route(handle, pathname, response, postData, request);
        });
    }

    http.createServer(onRequest).listen(config.port);
    io.connect(config.wsPort);
    console.log('Listening on port', config.port)
}

exports.start = start;



// Use connect method to connect to the Server
