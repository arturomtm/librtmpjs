const { Transform } = require('stream')

class Flv extends Transform {
  constructor() {
    super()
    this.audioPresent = false
    this.videoPresent = true
    this.previousTagSize = 0
  }
  getHeader() {
    return Buffer.from([
      0x46, 0x4C, 0x56, // FLV signature
      0x01, // version
      (Number(this.audioPresent) << 2) | Number(this.videoPresent),
      0x00, 0x00, 0x00, 0x09 // header length
    ])
  }
  _transform(tag, encoding, done) {
    if (!this.previousTagSize)
      this.push(this.getHeader())
    const tagSize = Buffer.alloc(4)
    tagSize.writeUInt32BE(this.previousTagSize)
    this.push(tagSize)
    this.push(tag)
    this.previousTagSize = tag.length
    done()
  }
}

module.exports = Flv
