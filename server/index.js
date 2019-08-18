var server = require('./server'),
    router = require('./router'),
    handlers = require('./handlers'),
    routes = {};

routes['/'] = handlers.home;
routes['/help'] = handlers.help;
routes['/some-room'] = handlers.room;
routes['/privacy-policy'] = handlers.pp;
routes['/upload'] = handlers.upload;
routes['/api'] = handlers.api;
routes['/api/subscription'] = handlers.subscription;
routes['/api/getNotification'] = handlers.getNotification;
routes['/api/getTextForId'] = handlers.getTextForId;
//routes['/thumb'] = handlers.thumb;
routes._static = handlers.serveStatic;

server.start(router.route, routes);

process.on('SIGINT', function() {
  process.exit();
});
