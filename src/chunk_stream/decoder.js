const Transform = require('stream').Transform

class ChunkStreamDecoder extends Transform {
  constructor(id) {
    super({})
    if (id < 2) throw new Error("Reserved Ids")
    this.id = id
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
  resetChunk() {
    this.chunk = Buffer.from([])
  }
  _transform(message, encoding, done) {
    const rawBasicHeader = message.slice(0, 3)
    const {fmt, id} = this._decodeBasicHeader(rawBasicHeader)
    if (this.id === id) {
      const offset = this._getBasicHeaderLength(id)
      const payloadOffset = offset + 11 - 4 * fmt
      const rawMessageHeader = message.slice(offset, payloadOffset)
      const payload = message.slice(payloadOffset)
      const {timestamp, length, typeId, streamId} = this._decodeMessageHeader(rawMessageHeader, {fmt, id})
      if (fmt === 0 || fmt === 1) {
        this.resetChunk()
      }
      this.chunk = Buffer.concat([this.chunk, payload])
      if (this.chunk.length === length) {
        this.push(this.chunk)
        this.resetChunk()
      }
    }
    done()
  }
}

exports.ChunkStreamDecoder = ChunkStreamDecoder
