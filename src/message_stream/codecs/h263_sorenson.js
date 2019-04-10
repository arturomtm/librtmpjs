const Codec = require('./codec')

const MESSAGE_TYPE_VIDEO = 9

class H263Sorenson extends Codec {
  constructor() {
    super()
    this.name = `Sorenson's H.263`,
    this.id = 2 // TODO: this value comes from a constant somewhere
    this.encrypted = false
    this.streamId = 0 // always 0
  }
  // extractTemporalReference(videoData) {
    // return (videoData.readUInt16BE(2) >> 2) & 0xFF
  // }
  generateTagHeader(video) {
    const header = Buffer.alloc(11)
    header.writeUInt32BE(this.streamId, 7)
    header.writeUInt8(0, 7) // timestampExtended
    header.writeUInt32BE(video.timestamp, 3)
    header.writeUInt32BE(video.data.length, 0)
    header.writeUInt8(
      (Number(this.encrypted) << 5) | MESSAGE_TYPE_VIDEO
    , 0)
    return header
  }
  _decode(video) {
    return Buffer.concat([
      this.generateTagHeader(video),
      video.data
    ])
  }
}

module.exports = H263Sorenson
