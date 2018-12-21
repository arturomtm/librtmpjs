const Transform = require('stream').Transform

class ChunkStreamEncoder extends Transform {
  constructor(id, config) {
    super({})
    if (id < 2) throw new Error("Reserved Ids")
    this.clock = Date
    this.config = config
    this.id = this._encodeId(id)
    this.fmt = 0
    this.lastTimestamp = 0
    this.on('pipe', (src) => this.messageStream = src)
  }
  _encodeId(id) {
    let csid;
    switch (true) {
    case id >= 2 && id <= 63:
      return [id]
    case id >= 64 && id <= 319:
      csid = id - 64
      return [0, csid]
    case id >= 320 && id <= 65599:
      csid = int2array(id - 64, 2)
      return [1, ...csid]
    }
  }
  _encodeBasicHeader() {
    const id = [...this.id]
    id[0] |= this.fmt << 6
    return id
  }
  _encodeMessageHeader({id, length, typeId}) {
    let header = []
    const timestamp = this.clock.time()
    switch(this.fmt) {
    case 0:
      this.lastTimestamp = 0
      header = int2arrayLE(id, 4)
    case 1:
      const messageLength = int2arrayBE(length, 3)
      header = [...messageLength, typeId, ...header]
    case 2:
      const delta = int2arrayBE(timestamp - this.lastTimestamp, 3)
      header = [...delta, ...header]
    }
    if (timestamp === 0xFFFFFF) {
      // append extended timestamp here
    }
    this.lastTimestamp = timestamp
    return header
  }
  _transform(message, encoding, done) {
    const info = {
      id: this.messageStream.id,
      length: message.length,
      typeId: this.messageStream.getMessageType()
    }
    if (!info.length) return;
    for(let i=0; i < info.length;) {
      const chunk = message.slice(i, i + this.config.size)
      const basicHeader = this._encodeBasicHeader()
      const messageHeader = this._encodeMessageHeader(info)
      const rawChunk = Buffer.concat([
        new Buffer([...basicHeader, ...messageHeader]),
        chunk
      ])
      this.push(rawChunk)
      //setting fmt is not as simple as this!
      this.fmt = 3
      i += chunk.length
    }
    this.fmt = 0
    done()
  }
}

const int2array = (n, bytes) => {
  const arr = []
  for (let i=0; i < bytes; ++i) {
    arr[i] = (n >> 8 * i) & 0xFF
  }
  return arr
}

const int2arrayBE = (n, bytes) => int2array(n, bytes).reverse()
const int2arrayLE = (n, bytes) => int2array(n, bytes)

exports.ChunkStreamEncoder = ChunkStreamEncoder
