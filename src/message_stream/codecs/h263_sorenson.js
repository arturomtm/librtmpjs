const Codec = require('./codec')

class H263Sorenson extends Codec {
  constructor() {
    super()
    this.name = 'Sorenson\'s H.263',
    // TODO: this value comes from a constant somewhere
    this.id = 2
  }
}

module.exports = H263Sorenson
