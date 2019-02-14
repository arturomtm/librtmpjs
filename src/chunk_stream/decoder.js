const Transform = require('stream').Transform
const extractChunkHeader = require('./header')
const ProtocolConfig = require('./config')

class ChunkStreamDecoder extends Transform {
  constructor() {
    super({ readableObjectMode: true })
    this.buffer = Buffer.from([])
    this.resetPendingMessage()
  }
  resetPendingMessage() {
    this.message = new Buffer(0)
    this.pendingMessage = {}
  }
  /* canProcessChunk(header) {
    const { length, payloadLength } = header
    return this.chunk.length >= length + Math.min(128, payloadLength)
  } */
  isChunkBufferEmpty() {
    return this.buffer.length === 0
  }
  getRemainingLength() {
    const { payloadLength = 0 } = this.pendingMessage
    return payloadLength - this.message.length
  }
  isPendingMessageProcessed() {
    return this.getRemainingLength() === 0
  }
  processChunk() {
    if (this.isChunkBufferEmpty()) return

    const chunkHeader = extractChunkHeader(this.buffer)
    const payloadLength = Math.min(128, chunkHeader.payloadLength || this.getRemainingLength())
    const messageLength = chunkHeader.length + payloadLength

    // extract condition check to a helper method
    if (this.buffer.length >= messageLength) {
      this.message = Buffer.concat([
        this.message,
        this.buffer.slice(chunkHeader.length, messageLength)
      ])
      this.buffer = this.buffer.slice(messageLength)
      this.pendingMessage = {
        ...this.pendingMessage,
        ...chunkHeader
      }

      if (this.isPendingMessageProcessed()) {
        this.push({
          ...this.pendingMessage,
          message: this.message
        })
        this.resetPendingMessage()
      }
      this.processChunk()
    }
  }
  _transform(chunk, encoding, done) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    try {
      this.processChunk()
    } catch(e) {
      console.log(e.message)
    } finally {
      done()
    }
  }
}

exports.ChunkStreamDecoder = ChunkStreamDecoder
