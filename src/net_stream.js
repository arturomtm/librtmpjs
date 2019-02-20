const CommandStream = require('./command_stream')
const util = require('./util')

class NetStream extends CommandStream {
  async play(streamName) {
    const command = this.getPlayCommand(...arguments)
    await this.send("play", ...command)
  }

  getPlayCommand(streamName = util.mandatoryParam('streamName'), commandObject = null, start = -2, duration = -1, reset = false) {
    return [commandObject, streamName] //, start, duration, reset]
  }
}

module.exports = NetStream
