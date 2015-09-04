
import view from './view';

var messages = {};
Object.assign(messages, view, {
  template: '<span/>',

  addMessage: function(videoUrl, text){
    if(!videoUrl) return;

    var container = document.createElement('div'),
        video = document.createElement('video'),
        span = document.createElement('span');

    container.classList.add('message');

    video.loop = true;
    video.autoplay = true;
    video.src = videoUrl;
    video.onloadedmetadata = function() {
      try {
        video.play();
      } catch(e){}
    };



    span.innerText = text;

    container.appendChild(video);
    container.appendChild(span);

    this.el.prepend(container);

    var msgElements = this.el.find('div.message');
    if(msgElements.length > this.maxVideos){
      for (var i = this.maxVideos; i < msgElements.length; i++) {
        msgElements.get(i).remove();
      };
    }
  }
});

export default messages;