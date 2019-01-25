const Duplex = require("stream").Duplex

class ControlStream extends Duplex {
  constructor(protocolParams) {
    super({objectMode: true})
    this.chunkStreamId = ControlStream.CHUNK_STREAM_ID
    this.id = 0
    this.protocolParams = protocolParams
  }

  getMessageType() {
    if (!this.messageType) throw new Error("No message type set")
    return this.messageType
  }

  ackWindowSize(size = this.protocolParams.windowSize) {
    this.messageType = ControlStream.WINDOW_ACK_SIZE
    this.protocolParams.ackWindowSize = size
    const res = new Buffer(4)
    res.writeUInt32BE(size)
    this.push(res)
  }

  _write(chunk, encoding, done) {
    switch(chunk.messageType){
    /* case ControlStream.SET_CHUNK_SIZE:
      this.onSetChunkSize()
      break
    case ControlStream.ABORT:
      this.onAbort()
      break
    case ControlStream.ACK:
      this.onAck()
      break
    case ControlStream.WINDOW_ACK_SIZE: 
      this.onAckWindowSize()
      break
    case ControlStream.SET_PEER_BANDWIDTH: 
      const { payload } = chunk
      const windowSize = payload.readUInt32BE(0)
      const limitType = payload.readUInt8(4)
      this.onSetPeerBandwidth(windowSize, limitType)
      break */
    }
    done()
  }
  _read() {}

  /* onSetChunkSize(size) {}

  onAbort(chunkStreamId) {}

  onAck(seqNum) {}

  onAckWindowSize(windowSize) {}

  onSetPeerBandwidth(windowSize, limitType) {
    // ignore limit type by now
    if (this.protocolParams.ackWindowSize !== windowSize) {
      this.ackWindowSize(windowSize)
    }
  } */
}

ControlStream.CHUNK_STREAM_ID = 2
ControlStream.SET_CHUNK_SIZE              = 0x01
ControlStream.ABORT                       = 0x02
ControlStream.ACK                         = 0x03
ControlStream.WINDOW_ACK_SIZE             = 0x05
ControlStream.SET_PEER_BANDWIDTH          = 0x06

module.exports = ControlStream
