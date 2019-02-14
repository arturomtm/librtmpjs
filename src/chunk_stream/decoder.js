const Transform = require('stream').Transform
const { size } = require('./config')

const MAX_BASIC_HEADER_LENGTH = 3
const MAX_CHUNK_HEADER_LENGTH = 11

class ChunkStreamDecoder extends Transform {
  constructor() {
    super({ readableObjectMode: true })
    this.buffer = Buffer.from([])
    this.resetPendingMessage()
  }
  resetPendingMessage() {
    this.pendingMessage = {
      message: new Buffer(0)
    }
  }
  _getBasicHeaderLength(id) {
    switch (true) {
    case id >= 2 && id <= 63:
      return 1
    case id >= 64 && id <= 319:
      return 2
    case id >= 320 && id <= 65599:
      return 3
    }
  }
  _getMessageHeaderLength(fmt) {
    return Math.max(0, MAX_CHUNK_HEADER_LENGTH - 4 * fmt)
  }
  _decodeBasicHeader(header) {
    let id = header.readUInt8(0) & 0x3F
    switch(id) {
    case 0:
      id = header.readUInt8(1) + 64
      break
    case 1:
      id = header.readUInt16BE(1) + 64
    }
    const fmt = (header.readUInt8(0) & 0xC0) >> 6
    const length = this._getBasicHeaderLength(id)
    return {fmt, id, length}
  }
  _decodeMessageHeader(header, basicHeader) {
    const messageHeader = {
      length: this._getMessageHeaderLength(basicHeader.fmt)
    }
    switch(basicHeader.fmt) {
    case 0:
      messageHeader.streamId = header.readUInt32BE(6) & 0x00FFFFFF
    case 1:
      messageHeader.typeId = header.readUInt8(6)
      messageHeader.payloadLength = header.readUInt32BE(3) >> 8
    case 2:
      messageHeader.timestamp = header.readUInt32BE(0) >> 8
    }
    return messageHeader
  }
  _getCurrentChunkHeader() {
    const rawBasicHeader = this.buffer.slice(0, MAX_BASIC_HEADER_LENGTH)
    const basicHeader = this._decodeBasicHeader(rawBasicHeader)

    const rawMessageHeader = this.buffer.slice(basicHeader.length, basicHeader.length + MAX_CHUNK_HEADER_LENGTH)
    const messageHeader = this._decodeMessageHeader(rawMessageHeader, basicHeader)

    return {
      ...basicHeader,
      ...messageHeader,
      length: basicHeader.length + messageHeader.length
    }
  }
  /* canProcessChunk(header) {
    const { length, payloadLength } = header
    return this.chunk.length >= length + Math.min(128, payloadLength)
  } */
  isChunkBufferEmpty() {
    return this.buffer.length === 0
  }
  getRemainingLength() {
    const { message, payloadLength = 0 } = this.pendingMessage
    return payloadLength - message.length
  }
  isPendingMessageProcessed() {
    return this.getRemainingLength() === 0
  }
  processChunk() {
    if (this.isChunkBufferEmpty()) return

    const chunkHeader = this._getCurrentChunkHeader()
    const payloadLength = Math.min(128, chunkHeader.payloadLength || this.getRemainingLength())
    const messageLength = chunkHeader.length + payloadLength

    // extract condition check to a helper method
    if (this.buffer.length >= messageLength) {
      const message = this.buffer.slice(chunkHeader.length, messageLength)
      this.pendingMessage = {
        ...this.pendingMessage,
        ...chunkHeader,
        message: Buffer.concat([this.pendingMessage.message, message]),
      }
      this.buffer = this.buffer.slice(messageLength)

      if (this.isPendingMessageProcessed()) {
        this.push(this.pendingMessage)
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
