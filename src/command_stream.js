const AMF = require('amf')
const MessageStream = require('./message_stream')
const { codeToEvent } = require('./util')

class CommandStream extends MessageStream {

  constructor(id, chunkId) {
    super(id, chunkId)
    this.transactionId = -1
    this.executionQueue = []
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

  _onStatus(commandObject, infoObject) {
    const { level, code } = infoObject
    let event = level
    switch(level) {
    case 'status':
      event = codeToEvent(code)
      break
    case 'warning':
    case 'error':
    default:
    }
    this.emit(event, infoObject)
  }

  send(commandName, ...commandObjects) {
    return new Promise((_result, _error) => {
      const chunk = [commandName, this.getTransactionId(), ...commandObjects]
      const payload = this.amf.encode(...chunk)
      this.executionQueue[this.transactionId] = {
        commandName,
        _result,
        _error,
        onStatus: eventData => this._onStatus(...eventData)
      }
      this.push(payload)
    })
  }

  _canProcessMessage(typeId) {
    return [
      CommandStream.MESSAGE_TYPE_COMMAND_AMF0,
      CommandStream.MESSAGE_TYPE_COMMAND_AMF3
    ].includes(typeId)
  }

  _receive({ message }) {
    const [
      method,
      transactionId,
      ...eventData
    ] = this.amf.decode(message)
    // TODO: definitively abstract this to avoid undefined errors!
    this.executionQueue[transactionId][method](eventData)
  }
}

CommandStream.MESSAGE_TYPE_COMMAND_AMF0 = 20 
CommandStream.MESSAGE_TYPE_COMMAND_AMF3 = 17

module.exports = CommandStream
