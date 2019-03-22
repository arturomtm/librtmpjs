const Codec = require('./codec')

class H264MP4 extends Codec {
  constructor() {
    super()
    this.name = 'MP4 H.264'
    // TODO: this value comes from a constant somewhere
    this.id = 7
  }
}

module.exports = H264MP4
