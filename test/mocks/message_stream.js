const Readable = require('stream').Readable
const mockData = require('./message_stream.config')

class MessageStream extends Readable {
  _read() {
    this.push(new Buffer(mockData))
    this.push(null)
  }
  getMessageInfo(message) {
    return {
      id: 0,
      length: message.length,
      typeId: 0x14
    }
  }
}

MessageStream.NET_CONNECTION_ID = 0

module.exports = MessageStream
