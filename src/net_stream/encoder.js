const Readable = require("stream").Readable
const AMF = require('amf')

class NetStreamEncoder extends Readable {
  constructor(id, options) {
    super(options)
    this.id = id
    this.amf = new AMF.AMF0()
  }

  getMessageInfo(message, ...info) {
    return {
      id: this.id,
      typeId: this.getMessageType(),
      length: message.length
    }
  }

  getMessageType() {
    return {
      0: NetStreamEncoder.MESSAGE_TYPE_COMMAND_AMF0,
      3: NetStreamEncoder.MESSAGE_TYPE_COMMAND_AMF3
    }[this.amf.encoding]
  }

  sendCommand(data) {
    const payload = this.amf.encode(...data)
    const messageType = this.getMessageType()
    this.send({ header: { messageType }, payload })
  }

  buildHeader(header) {
    const buffer = new Buffer(11)
    buffer.writeUInt8(header.messageType, 0)
    buffer.writeUInt16BE(header.payloadLength >> 8, 1)
    buffer.writeUInt8(header.payloadLength & 0xff, 3)
    buffer.writeUInt32BE(header.timestamp, 4)
    buffer.writeUInt16BE(header.streamId >> 8, 8)
    buffer.writeUInt8(header.streamId & 0xff, 10)
    return buffer
  }

  _read() {}

  send({ header = {}, payload = new Buffer(0) }) {
    let completeHeader = this.buildHeader(Object.assign({
      payloadLength: payload.length,
      timestamp: this.clock.time(),
      streamId: this.id
    }, header))
    let packet = Buffer.concat([completeHeader, payload])
    console.log('Message packet', packet)
    this.push(packet)
  }

  static get MESSAGE_TYPE_COMMAND_AMF0() { return 20 }
  static get MESSAGE_TYPE_COMMAND_AMF3() { return 17 }
}

module.exports = NetStreamEncoder
