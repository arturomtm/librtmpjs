const Transform = require('stream').Transform

const MAX_CHUNK_HEADER_LENGTH = 11

class ChunkStreamDecoder extends Transform {
  constructor() {
    super({ readableObjectMode: true })
    this.chunk = Buffer.from([])
  }
  _decodeBasicHeader(header) {
    let fmt = (header.readUInt8(0) & 0xC0) >> 6
    let id = header.readUInt8(0) & 0x3F
    switch(id) {
    case 0:
      id = header.readUInt8(1) + 64
    case 1:
      id = header.readUInt16(1) + 64
    }
    return {id, fmt}
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
  _decodeMessageHeader(header, basicHeader) {
    let streamId, typeId, length, timestamp
    switch(basicHeader.fmt) {
    case 0:
      streamId = header.readUInt32BE(6) & 0x00FFFFFF
    case 1:
      typeId = header.readUInt8(6)
      length = header.readUInt32BE(3) >> 8
    case 2:
      timestamp = header.readUInt32BE(0) >> 8
    }
    return {timestamp, length, typeId, streamId}
  }
  _getCurrentMessage() {
    const rawBasicHeader = this.chunk.slice(0, 3)
    const {fmt, id} = this._decodeBasicHeader(rawBasicHeader)
    const basicHeaderOffset = this._getBasicHeaderLength(id)
    const payloadOffset = basicHeaderOffset + (MAX_CHUNK_HEADER_LENGTH - 4 * fmt)
    const rawMessageHeader = this.chunk.slice(basicHeaderOffset, payloadOffset)
    const messageHeader = this._decodeMessageHeader(rawMessageHeader, {fmt, id})
    this.chunk = this.chunk.slice(payloadOffset)
    return { fmt, id, ...messageHeader }
  }
  processChunk() {
      const messageHeader = this._getCurrentMessage()
      const { length } = messageHeader
      if (this.chunk.length >= length) {
        const message = this.chunk.slice(0, length)
        this.chunk = this.chunk.slice(length)
        console.log({ ...messageHeader, message })
        this.push({ ...messageHeader, message })
        this.processChunk()
      }
  }
  _transform(chunk, encoding, done) {
    this.chunk = Buffer.concat([this.chunk, chunk])
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
