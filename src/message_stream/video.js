const MessageStream = require('./message_stream')
const CodecFactory = require('./codecs/codec_factory')

const VIDEO_ENCODING_MASK = 0x0F
const VIDEO_FRAME_MASK = 0xF0

const KEY_FRAME = 1
const NON_KEY_FRAME = 2
const DISPOSABLE_FRAME = 3
const GENERATED_KEY_FRAME = 4
const COMMAND_FRAME = 5

class VideoStream extends MessageStream {

  setCodec(codecId) {
    this.out = CodecFactory.getCodecInstance(codecId)
    this.pipe(this.out)
    this.emit("ready", this.out)
  }

  _canProcessMessage(typeId) {
    return [
      VideoStream.MESSAGE_TYPE_VIDEO
    ].includes(typeId)
  }

  _extractTagInfo(control) {
    const frameType = (control & VIDEO_FRAME_MASK) >> 4
    const codecId = control & VIDEO_ENCODING_MASK
    return { codecId, frameType }
  }

  _receive({ message }) {
    const tagInfo = this._extractTagInfo(message[0])
    switch (tagInfo.frameType) {
    case COMMAND_FRAME:
      const command = message[1]
      try {
        this._receive(message.slice(2))
      } catch (e) {}
      break;
    case KEY_FRAME:
    case NON_KEY_FRAME:
    case DISPOSABLE_FRAME:
    case GENERATED_KEY_FRAME:
      if (!this.out) this.setCodec(tagInfo.codecId)
      this.push({
        ...tagInfo,
        data: message.slice(1)
      })
    }
  }
}

VideoStream.MESSAGE_TYPE_VIDEO = 9

module.exports = VideoStream
