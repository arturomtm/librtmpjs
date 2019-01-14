const net = require('net')
const { Handshake } = require('./handshake')
const ChunkStream = require('./chunk_stream')
const NetConnection = require('./net_connection')
const ControlStream = require('./control_stream')
const TimeService = require('./services/time')
const ChunkStreamParams = require('./chunk_stream/config')

class RTMPSocket {
  constructor({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}) {
    const rtmpOptions = {app, swfUrl, tcUrl, pageUrl}

    const socket = net.connect({host, port})
    const handshake = new Handshake(socket)
    const controlStream = new ControlStream(ChunkStreamParams)
    const netConnection = new NetConnection()

    pipe(controlStream, socket)
    pipe(netConnection, socket)

    handshake.once("uninitialized", () => handshake.sendC0C1())
    handshake.once("handshake:done", () => netConnection.connect(rtmpOptions))

    netConnection.once('netconnection:connect:success', () => controlStream.ackWindowSize())
    netConnection.once('netconnection:connect:success', () => netConnection.createStream())
  }
}

const pipe = (stream, socket) => {
  const chunkStream = new ChunkStream(stream.CHUNK_STREAM_ID)
  stream.pipe(chunkStream.encoder).pipe(socket)
  socket.pipe(chunkStream.decoder).pipe(stream)
}

module.exports = RTMPSocket
