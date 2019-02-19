const ChunkStreamParams = require('./chunk_stream/config')
const {
  encoder: ChunkStreamEncoder,
  decoder: ChunkStreamDecoder
} = require('./chunk_stream')

const ControlStream = require('./control_stream')
const UserControlStream = require('./user_control_stream')
const NetConnection = require('./net_connection')

class StreamFactory {
  constructor(socket) {
    this.socket = socket
    this.chunkStreamDecoder = socket.pipe(new ChunkStreamDecoder())

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
}

module.exports = StreamFactory
