const ChunkStreamEncoder = require('./encoder').ChunkStreamEncoder
const Clock = require('../services/time')
const defaultConfig = require('./config')

class ChunkStream {
  constructor(id) {
    this.encoder = new ChunkStreamEncoder(id, defaultConfig)
    this.encoder.clock = Clock
  }
  pipe(duplexStream) {
    this.encoder.pipe(duplexStream)
  }
}

ChunkStream.CONTROL_STREAM_ID = 2

exports.ChunkStream = ChunkStream
