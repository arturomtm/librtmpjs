const AMF = require('rtmp-amf')
const MessageStream = require('./message_stream')

class DataStream extends MessageStream {

  constructor(id, chunkId) {
    super(id, chunkId)
    this.amf = new AMF.AMF0()
  }

  onMetaData(...metadata) {
    this.emit("metadata", ...metadata)
  }

  _canProcessMessage(typeId) {
    return [
      DataStream.MESSAGE_TYPE_COMMAND_AMF0,
      DataStream.MESSAGE_TYPE_COMMAND_AMF3
    ].includes(typeId)
  }

  _receive({ message }) {
    const [
      method,
      ...eventData
    ] = this.amf.decode(message)
    const dataMethod = this[method]
    if (dataMethod) {
      dataMethod.call(this, ...eventData)
    }
  }
}

DataStream.MESSAGE_TYPE_COMMAND_AMF0 = 18 
DataStream.MESSAGE_TYPE_COMMAND_AMF3 = 15

module.exports = DataStream
