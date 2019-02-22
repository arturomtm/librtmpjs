const Transform = require('stream').Transform
const extractChunkHeader = require('./header')

class ChunkStreamDecoder extends Transform {
  constructor(protocolConfig) {
    super({ readableObjectMode: true })
    this.config = protocolConfig
    this._chunkHeaders = new HeadersCache()
    this.buffer = Buffer.from([])
    this.message = Buffer.from([])
  }
  isChunkBufferEmpty() {
    return this.buffer.length === 0
  }
  processChunk() {
    if (this.isChunkBufferEmpty()) return

    const newChunkHeader = extractChunkHeader(this.buffer)
    const lastChunkHeader = this._chunkHeaders.get(newChunkHeader.id)
    const chunkHeader = { ...lastChunkHeader, ...newChunkHeader }
    const payloadLength = Math.min(this.config.size, chunkHeader.payloadLength - this.message.length)
    const messageLength = chunkHeader.length + payloadLength

    if (this.buffer.length >= messageLength) {
      this.message = Buffer.concat([
        this.message,
        this.buffer.slice(chunkHeader.length, messageLength)
      ])
      this.buffer = this.buffer.slice(messageLength)
      this._chunkHeaders.save(chunkHeader)

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

class HeadersCache {
  constructor() {
    this.headers = {}
  }
  get(chunkId) {
    return this.headers[chunkId] || {}
  }
  save(header) {
    this.headers[header.id] = header
  }
}

module.exports = ChunkStreamDecoder
