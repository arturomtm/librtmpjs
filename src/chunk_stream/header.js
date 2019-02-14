const MAX_BASIC_HEADER_LENGTH = 3
const MAX_CHUNK_HEADER_LENGTH = 11

function getBasicHeaderLength(id) {
  switch (true) {
  case id >= 2 && id <= 63:
    return 1
  case id >= 64 && id <= 319:
    return 2
  case id >= 320 && id <= 65599:
    return 3
  }
}

function getMessageHeaderLength(fmt) {
  return Math.max(0, MAX_CHUNK_HEADER_LENGTH - 4 * fmt)
}

function decodeBasicHeader(header) {
  let id = header.readUInt8(0) & 0x3F
  switch(id) {
  case 0:
    id = header.readUInt8(1) + 64
    break
  case 1:
    id = header.readUInt16BE(1) + 64
  }
  const fmt = (header.readUInt8(0) & 0xC0) >> 6
  const length = getBasicHeaderLength(id)
  return {fmt, id, length}
}

function decodeMessageHeader(header, basicHeader) {
  const messageHeader = {
    length: getMessageHeaderLength(basicHeader.fmt)
  }
  switch(basicHeader.fmt) {
  case 0:
    messageHeader.streamId = header.readUInt32BE(6) & 0x00FFFFFF
  case 1:
    messageHeader.typeId = header.readUInt8(6)
    messageHeader.payloadLength = header.readUInt32BE(3) >> 8
  case 2:
    messageHeader.timestamp = header.readUInt32BE(0) >> 8
  }
  return messageHeader
}

function extractChunkHeader(buffer) {
  const rawBasicHeader = buffer.slice(0, MAX_BASIC_HEADER_LENGTH)
  const basicHeader = decodeBasicHeader(rawBasicHeader)

  const rawMessageHeader = buffer.slice(basicHeader.length, basicHeader.length + MAX_CHUNK_HEADER_LENGTH)
  const messageHeader = decodeMessageHeader(rawMessageHeader, basicHeader)

  return {
    ...basicHeader,
    ...messageHeader,
    length: basicHeader.length + messageHeader.length
  }
}

module.exports = extractChunkHeader
