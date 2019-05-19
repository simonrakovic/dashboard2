const Stream = require('node-rtsp-stream-es6')

let options = {
  name: 'streamName',
  url: 'rtsp://admin:Nomis1992!@192.168.0.220:554/Streaming/Channels/102/',
  port: 9999,
}


stream = new Stream(options)

stream.start()
