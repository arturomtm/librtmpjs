const Duplex = require("stream").Duplex

class UserControlStream extends Duplex {
  constructor(protocolParams) {
    super({objectMode: true})
    this.chunkStreamId = UserControlStream.CHUNK_STREAM_ID
    this.id = 0
  }

  getMessageType() {
    if (!this.messageType) throw new Error("No message type set")
    return this.messageType
  }
  
  _receive(message) {
    const eventType = message.readUInt16BE(0)
    const eventName = UserControlStream.EVENT_NAMES[eventType]
    const eventData = {}

    switch(eventType) {
    case PING_REQUEST:
    case PING_RESPONSE:
      eventData.timestamp = message.readUInt32BE(4)
      break
    case SET_BUFFER_LENGTH:
      eventData.bufferLength = message.readUInt32BE(4)
    default:
      eventData.streamId = message.readUInt32BE(2)
    }

    this.emit(eventName, eventData)
  }

  // Underlying mandatory-to-implement Stream methods
  _write(chunk, encoding, done) {
    const { typeId, id } = chunk
    if (typeId === UserControlStream.USER_CONTROL_MESSAGE) {
      if (this.chunkStreamId === id) {
        this._receive(chunk.message)
      }
    }
    done()
  }
  _read() {}

}

const STREAM_BEGIN       = 0x00
const STREAM_EOF         = 0x01
const STREAM_DRY         = 0x02
const SET_BUFFER_LENGTH  = 0x03
const STREAM_IS_RECORDED = 0x04
const PING_REQUEST       = 0x06
const PING_RESPONSE      = 0x07

UserControlStream.CHUNK_STREAM_ID          = 0x02

UserControlStream.USER_CONTROL_MESSAGE     = 0x04

UserControlStream.EVENT_STREAM_BEGIN       = STREAM_BEGIN
UserControlStream.EVENT_STREAM_EOF         = STREAM_EOF
UserControlStream.EVENT_STREAM_DRY         = STREAM_DRY
UserControlStream.EVENT_SET_BUFFER_LENGTH  = SET_BUFFER_LENGTH
UserControlStream.EVENT_STREAM_IS_RECORDED = STREAM_IS_RECORDED
UserControlStream.EVENT_PING_REQUEST       = PING_REQUEST
UserControlStream.EVENT_PING_RESPONSE      = PING_RESPONSE

UserControlStream.EVENT_NAMES = [
  'stream:begin',
  'stream:eof',
  'stream:dry',
  'setBufferLength',
  'stream:isRecorded',
  undefined,
  'ping:request',
  'ping:response'
]

module.exports = UserControlStream
