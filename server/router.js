
function route(handle, pathname, response, postData, request){
  var staticExt = {
    'js': true,
    'webm': true,
    'png': true,
    'json': true,
    'jpg': true,
    'css': true,
    'eot': true,
    'woff2': true,
    'ttf': true
  };

  var ext = pathname.split('.').pop();

  if(typeof handle[pathname] === 'function'){
      handle[pathname](response, postData, request);
  } else if(staticExt[ext]){
    handle._static(response, pathname, postData, request);
  } else {
    handle['/'](response, postData, request);
    //response.writeHead(404, { 'Content-Type': 'text/plain' });
    //response.end();
  }
};


exports.route = route;