
function route(handle, pathname, response, postData){
  var staticExt = {
    'js': true,
    'webm': true,
  };

  var ext = pathname.split('.').pop();

  if(typeof handle[pathname] === 'function'){
      handle[pathname](response, postData);
  } else if(staticExt[ext]){
    handle._static(response, pathname, postData);
  } else {
    handle['/'](response, postData);
    //response.writeHead(404, { 'Content-Type': 'text/plain' });
    //response.end();
  }
};


exports.route = route;