const Readable = require('stream').Readable
const mockData = require('./socket_stream.config')

class SocketStream extends Readable {
  _read() {
    this.push(new Buffer(mockData))
    this.push(null)
  }
}

module.exports = SocketStream
