const rtmp = require('../src/rtmp')
const config = require('./config')

async function test() {
  try {
    const netStream = await rtmp.connect(config)
    netStream.on('error', console.log)
    netStream.on('play:start', console.log)
    netStream.play(config.playpath)
  } catch(e) {
    console.log(e)
  }
}

test()