const CommandStream = require('./command_stream')
const util = require('./util')

class NetStream extends CommandStream {
  play(streamName) {
    const command = this.getPlayCommand(...arguments)
    this.send("play", ...command)
  }

  getPlayCommand(streamName = util.mandatoryParam('streamName'), commandObject = null, start = -2, duration = -1, reset) {
    return [commandObject, streamName, start, duration, reset]
  }
}

module.exports = NetStream
