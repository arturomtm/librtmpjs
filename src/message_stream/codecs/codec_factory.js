const VIDEO_CODECS = [
  'RGB',
  'run-length',
  require('./h263_sorenson'),
  'Screen 1',
  'On2 TrueMotion VP6',
  'VP6 with alpha',
  'Screen 2',
  require('./h264_mp4'),
  'ITU H.263',
  'MPEG-4 ASP.'
]

function getCodecInstance(codecId) {
  const Codec = VIDEO_CODECS[codecId]
  if (!Codec) throw new Error(`No codec available for ${codecId}`)
  return new Codec()
}

module.exports = {
  getCodecInstance
} 
