const ChunkStreamParams = require('./chunk_stream/config')
const {
  encoder: ChunkStreamEncoder,
  decoder: ChunkStreamDecoder
} = require('./chunk_stream')
const ChunkProtocolConfig = require('./chunk_stream/config')

const ControlStream = require('./control_stream')
const UserControlStream = require('./user_control_stream')
const NetConnection = require('./net_connection')
const NetStream = require('./net_stream')

class StreamFactory {
  constructor(socket) {
    // starts after the net connection chunk stream
    // improve this creating a cache for chunk streams
    this.chunkId = 3

    this.socket = socket
    this.chunkStreamDecoder = socket.pipe(new ChunkStreamDecoder(ChunkProtocolConfig))

    this.controlStream = this._pipe(new ControlStream(ChunkStreamParams))
    this.userControlStream = this._pipe(new UserControlStream())
    this.netConnection = this._pipe(new NetConnection())
  }
  _pipe(stream) {
    stream
      .pipe(new ChunkStreamEncoder(stream.chunkStreamId))
      .pipe(this.socket)
    this.chunkStreamDecoder
      .pipe(stream)
    return stream
  }
  getChunkId() {
    return ++this.chunkId
  }
  createNetStream(id, chunkId = this.getChunkId()) {
    const netStream = new NetStream(id, chunkId)
    netStream._streamFactory = this
    return this._pipe(netStream)
  }
}

module.exports = StreamFactory
