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
const DataStream = require('./message_stream/data')
const VideoStream = require('./message_stream/video')

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

    this.controlStream.on("setChunkSize", (size) => { ChunkProtocolConfig.size = size })
  }
  _pipeInput(stream) {
    this.chunkStreamDecoder
      .pipe(stream)
    return stream
  }
  _pipeOutput(stream) {
    stream
      .pipe(new ChunkStreamEncoder(stream.chunkStreamId))
      .pipe(this.socket)
    return stream
  }
  _pipe(stream) {
    this._pipeInput(stream)
    this._pipeOutput(stream)
    return stream
  }
  getChunkId() {
    return ++this.chunkId
  }
  createNetStream(id, chunkId = this.getChunkId()) {
    const netStream = new NetStream(id, chunkId)
    netStream._streamFactory = this
    netStream.data = this._pipeInput(new DataStream(id))
    netStream.video = this._pipeInput(new VideoStream(id))
    return this._pipe(netStream)
  }
}

module.exports = StreamFactory
