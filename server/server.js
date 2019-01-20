/* eslint-env node */
var http = require('http'),
    url = require('url'),
    io = require('./io'),
    path = require('path'),
    config = {
      port: process.env.PORT || 8088,
      wsPorts: {
        dev: process.env.WSPORT || 5088,
        prod: process.env.WSPORT || 5088
      },

      upload_dir: path.resolve(__dirname, './uploads'),

      s3: {
          key: '',
          secret: '',
          bucket: ''
      },

      s3_enabled: false
    }

function isProd(){
  return process.env.NODE_ENV === 'production';
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
    io.connect(isProd(), config.wsPorts);
    console.log('Listening on port', config.port, 'in env', (isProd() ? 'PROD' : 'DEV'))
}

exports.start = start;



// Use connect method to connect to the Server
