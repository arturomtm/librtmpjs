const net = require('net')
const { Handshake, EncryptedHandshake } = require('./handshake')
const ChunkStream = require('./chunk_stream')
const { ChunkStreamDecoder } = require('./chunk_stream/decoder')
const NetConnection = require('./net_connection')
const ControlStream = require('./control_stream')
const TimeService = require('./services/time')
const ChunkStreamParams = require('./chunk_stream/config')

class RTMPSocket {
  constructor({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}) {
    const rtmpOptions = {app, swfUrl, tcUrl, pageUrl}

    const socket = net.connect({host, port})
    const handshake = new EncryptedHandshake(socket)
    const controlStream = new ControlStream(ChunkStreamParams)
    const netConnection = new NetConnection()

    handshake.once("uninitialized", () => handshake.sendC0C1())
    handshake.once("handshake:done", () => {
      const chunkStreamDecoder = socket.pipe(new ChunkStreamDecoder())

      pipe(controlStream, socket)
      chunkStreamDecoder.pipe(controlStream)
      pipe(netConnection, socket)
      chunkStreamDecoder.pipe(netConnection)

      netConnection.connect(rtmpOptions)
    })

    netConnection.once('netconnection:connect:success', () => netConnection.createStream())
  }
}

const pipe = (stream, socket) => {
  const chunkStream = new ChunkStream(stream.chunkStreamId)
  stream.pipe(chunkStream.encoder).pipe(socket)
}

module.exports = RTMPSocket
