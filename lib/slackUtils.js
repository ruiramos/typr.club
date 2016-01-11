import secrets from './secrets'
import Api from './api';

function _parseQueryString(query){
  var queryObject = {};

  if(!query) return queryObject;

  query.split('&').forEach((op) => {
    var obj = op.split('=');
    queryObject[obj[0]] = obj[1] || true;
  });

  return queryObject;
}

var _hooks = {
  // ometria: 'https://hooks.slack.com/services/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',
  // 'amigos-de-coimbra': 'https://hooks.slack.com/services/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'
};

var _rooms = {};

var oauthUrl = `https://slack.com/oauth/authorize?client_id=${secrets.slackClientId}&scope=chat:write:bot,channels:read`;

function checkSlackParams(){
  // runs on init
  var query = _parseQueryString(window.location.search.slice(1));

  if(query.code && query.state){
    var state = JSON.parse(decodeURIComponent(query.state));

    // @todo check if got a hook from cookie and return

    this.getHookEndpoint(query.code, state)
      .then(function(){
        setTimeout(function(){
          app.showSharingFor(state.id, state.room);
        }, 2000);
      })
  }
}

function fireOAuth(room, id){
  var state = { // message id and room that triggered the oauth
    room: room,
    id: id
  };

  var url = oauthUrl + '&redirect_uri=' + window.location.href.split('?')[0] +'&state=' + encodeURIComponent(JSON.stringify(state));

  window.location.href = url;
}

function getHookEndpoint(code, state){
  return Api.getSlackHookWithCode(code, state).then(function(resp){
    if(resp.ok){
      _hooks[state.room] = {team: resp.team_name, token: resp.access_token}
      app.cookies.slackChannels = app.cookies.slackChannels || {};
      app.cookies.slackChannels[state.room] = {team: resp.team_name, token: resp.access_token};
      app.updateCookie(app.cookies);
    }
  })
}

function getHook(room){
  _hooks[room] =  _hooks[room] || (app.cookies.slackChannels ? app.cookies.slackChannels[room] : undefined);
  return _hooks[room];
}

function removeIntegration(room){
  if(_hooks[room] || (app.cookies.slackChannels && app.cookies.slackChannels[room])){
    delete app.cookies.slackChannels[room];
    app.updateCookie(app.cookies);
    delete _hooks[room];
  }
}

function getSlackRoomFor(room){
  console.log(room, _hooks[room], _hooks, app.cookies)

  if(_rooms[room]){
    return Promise.resolve(_rooms[room]);
  } else if(getHook(room)){
    return _rooms[room] = Api.getSlackChannels(getHook(room).token).then(
      function(resp){
        if(resp.ok){
          _rooms[room] = resp.channels;
          return _rooms[room];
        }
      }
    );
  } else {
    return Promise.resolve(null);
  }
}

function setSelectedSlackRoom(room, roomId){
  _rooms[room].forEach((r) => {
    if(r.id === roomId){
      r.select = true;
    } else {
      r.select = false;
    }
  });
}


export default {
  checkSlackParams,
  fireOAuth,
  getHook,
  getHookEndpoint,
  removeIntegration,
  getSlackRoomFor,
  setSelectedSlackRoom
}