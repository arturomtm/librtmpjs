const Transform = require('stream').Transform
const extractChunkHeader = require('./header')
const ProtocolConfig = require('./config')

class ChunkStreamDecoder extends Transform {
  constructor() {
    super({ readableObjectMode: true })
    this._lastChunkHeaders = {}
    this.buffer = Buffer.from([])
    this.message = Buffer.from([])
  }
  _getLastHeader(chunkId) {
    return this._lastChunkHeaders[chunkId] || {}
  }
  _saveHeader(header) {
    this._lastChunkHeaders[header.id] = header
  }
  isChunkBufferEmpty() {
    return this.buffer.length === 0
  }
  processChunk() {
    if (this.isChunkBufferEmpty()) return

    const newChunkHeader = extractChunkHeader(this.buffer)
    const lastChunkHeader = this._getLastHeader(newChunkHeader.id)
    const chunkHeader = { ...lastChunkHeader, ...newChunkHeader }
    const payloadLength = Math.min(128, chunkHeader.payloadLength - this.message.length)
    const messageLength = chunkHeader.length + payloadLength

    // extract condition check to a helper method
    if (this.buffer.length >= messageLength) {
      this.message = Buffer.concat([
        this.message,
        this.buffer.slice(chunkHeader.length, messageLength)
      ])
      this.buffer = this.buffer.slice(messageLength)
      this._saveHeader(chunkHeader)

      if (this.message.length === chunkHeader.payloadLength) {
        this.push({
          ...chunkHeader,
          message: this.message
        })
        this.message = new Buffer(0)
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
