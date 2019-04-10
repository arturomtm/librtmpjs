const { Duplex } = require('stream')

class Codec extends Duplex {
  constructor() {
    super({ writableObjectMode: true })
  }

  _decode(frame) {
    throw new Error('_decode must be implemented by derived classes')
  }

  _write(video, encoding, done) {
    const tag = this._decode(video)
    this.push(tag)
    done()
  }

  _read() {}
}

module.exports = Codec
