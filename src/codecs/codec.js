const { Duplex } = require('stream')

class Codec extends Duplex {
  constructor() {
    super({ writableObjectMode: true })
  }

  _write(video) {
    console.log(video.data.toString('hex'))
  }

  _read() {}
}

module.exports = Codec
