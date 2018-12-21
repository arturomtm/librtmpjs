//const MessageStreamDecoder = require('./decoder').MessageStreamDecoder
const NetStreamEncoder = require('./encoder').NetStreamEncoder
const Clock = require('../services/time')

class NetStream {
  constructor(id) {
    //this.decoder = new MessageStreamDecoder(id)
    this.encoder = new NetStreamEncoder(id)
    this.encoder.clock = Clock
  }
  pipe(duplexStream) {
    this.encoder.pipe(duplexStream)
  }
}

exports.ChunkStream = NetStream
