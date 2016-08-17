# typr.club

[typr.club](https://typr.club) is a WebSockets based chat room system that sends short video messages with text.

It tries to provide a more expressive way of communicating online, while keeping the messaging simple, realtime and asynchronous.

Some features include:
  - Create "secret" rooms on the fly, appending the room name to the url
  - All video messages are converted to GIFs so you can share them everywhere
  - Slack and Facebook integration
  - Web Push Notifications when there's activity in a room you subscribed

It uses WebSockets, Redis and everything else is in Amazon - S3 for storing the captured videos (WebM) and a few AWS Lambda functions to convert them to MP4 and GIF using ffmpeg (inspired by [aws-lambda-ffmpeg](https://github.com/binoculars/aws-lambda-ffmpeg)).
Web Push Notifications implemented using a ServiceWorker and [GCM](https://developers.google.com/web/updates/2015/03/push-notifications-on-the-open-web?hl=en).

On the client side, it uses the great [RecordRTC](https://www.npmjs.com/package/recordrtc) package that made everything super easy. 
It uses [JSPM](http://jspm.io) & SystemJS for dependency management.

# How to run locally

Tested with node v5.8 and npm 3.7.3.
You'll need to have [Redis](http://redis.io/) running.
 
 - Install JSPM
 
    ```sh
    npm install -g jspm
    ```
    
 - Install dependencies
 
     ```sh
    npm install
    jspm install
    cd server && npm install
    ```
    
 - Start the server

     ```sh
    cd server && npm start
    ```

 - Visit `http://localhost:8000`

# Contribute

Any bugs, new features, ideas, etc, bring them on! :)

