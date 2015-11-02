var webPage = require('webpage');
var page = webPage.create();

page.viewportSize = { width: 1920, height: 1080 };
page.open("http://typr.club/wallapop", function start(status) {
  setTimeout(function(){
    page.render('./thumbnails/wallapop_thumb.png');
    phantom.exit();
  }, 1000);
});
