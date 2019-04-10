const fs = require('fs')
const rtmp = require('../src/rtmp')
const Flv = require('../src/message_stream/containers/flv')
const config = require('./config')

async function test() {
  try {
    const netStream = await rtmp.connect(config)
    netStream.on('error', console.log)
    netStream.on('play:start', console.log)
    netStream.play(config.playpath)
    netStream.video.on("ready", out =>
      out
        .pipe(new Flv())
        .pipe(fs.createWriteStream('./test_codec.flv'))
    )
  } catch(e) {
    console.log(e)
  }
}

test()