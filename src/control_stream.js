const MessageStream = require('./message_stream')

class ControlStream extends MessageStream {
  constructor(protocolParams) {
    super(0, ControlStream.CHUNK_STREAM_ID, protocolParams)
  }

  ackWindowSize(size = this.protocolParams.windowSize) {
    this.messageType = ControlStream.WINDOW_ACK_SIZE
    this.protocolParams.ackWindowSize = size
    const res = new Buffer(4)
    res.writeUInt32BE(size)
    this.push(res)
  }

  _receive({ typeId, message }) {
    switch(typeId){
    case ControlStream.SET_CHUNK_SIZE:
      this.onSetChunkSize(
        message.readUInt32BE(0)
      )
      break
    /* case ControlStream.ABORT:
      this.onAbort()
      break
    case ControlStream.ACK:
      this.onAck()
      break */
    case ControlStream.WINDOW_ACK_SIZE:
      this.onAckWindowSize(
        message.readUInt32BE(0)
      )
      break
    case ControlStream.SET_PEER_BANDWIDTH:
      this.onSetPeerBandwidth(
        message.readUInt32BE(0),
        message.readUInt8(4)
      )
      break
    }
  }

  // All these methods should be callbacks in response to a event

  onSetChunkSize(size) {
    // maybe this.emit should call onSetChunkSize (and all hooks)
    // to process size before emitting it, as opposed to this
    this.emit("setChunkSize", size)
  }

  onAckWindowSize(windowSize) {}

  onSetPeerBandwidth(windowSize, limitType) {
    // ignore limit type by now
    if (this.protocolParams.ackWindowSize !== windowSize) {
      // this.ackWindowSize(windowSize)
    }
  }

  /* onAbort(chunkStreamId) {}

  onAck(seqNum) {} */
}

ControlStream.CHUNK_STREAM_ID             = 0x02

ControlStream.SET_CHUNK_SIZE              = 0x01
ControlStream.ABORT                       = 0x02
ControlStream.ACK                         = 0x03
ControlStream.WINDOW_ACK_SIZE             = 0x05
ControlStream.SET_PEER_BANDWIDTH          = 0x06

module.exports = ControlStream
