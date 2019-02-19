const AMF = require('amf')
const MessageStream = require('./message_stream')

class CommandStream extends MessageStream {

  constructor(id, chunkId) {
    super(id, chunkId)
    this.transactionId = 0
    this.executionQueue = [null]
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
      0: CommandStream.MESSAGE_TYPE_COMMAND_AMF0,
      3: CommandStream.MESSAGE_TYPE_COMMAND_AMF3
    }[this.amf.encoding]
  }

  getTransactionId() {
    return ++this.transactionId
  }

  send(commandName, ...commandObjects) {
    return new Promise((_result, _error) => {
      const chunk = [commandName, this.getTransactionId(), ...commandObjects]
      const payload = this.amf.encode(...chunk)
      this.executionQueue[this.transactionId] = { _result, _error }
      this.push(payload)
    })
  }

  _receive({ message }) {
    const [
      method,
      transactionId,
      ...eventData
    ] = this.amf.decode(message)
    this.executionQueue[transactionId][method](eventData)
  }
}

CommandStream.MESSAGE_TYPE_COMMAND_AMF0 = 20 
CommandStream.MESSAGE_TYPE_COMMAND_AMF3 = 17

module.exports = CommandStream
