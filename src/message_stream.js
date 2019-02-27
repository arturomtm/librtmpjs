const { Duplex } = require("stream")

class MessageStream extends Duplex {
  constructor(id, chunkStreamId, protocolParams = {}) {
    super({objectMode: true})
    this.id = id 
    this.chunkStreamId = chunkStreamId
    this.protocolParams = protocolParams
  }

  getMessageType() {
    if (!this.messageType) throw new Error("No message type set")
    return this.messageType
  }
  
  _canProcessMessage(typeId) {
    throw new Error("Cannot determine which message types this stream can process")
  }

  _receive() {
    throw new Error('_receive must be implemented by derived classes')
  }

  // Underlying mandatory-to-implement Stream methods
  _write(chunk, encoding, done) {
    if (this.id === chunk.streamId && this._canProcessMessage(chunk.typeId)) {
      this._receive(chunk)
    }
    done()
  }
  _read() {}

}

module.exports = MessageStream
