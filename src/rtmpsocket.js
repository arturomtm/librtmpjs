const net = require('net')
const { Handshake, EncryptedHandshake } = require('./handshake')
const StreamFactory = require('./stream_factory')

class RTMPSocket {
  constructor({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}) {
    const socket = net.connect({host, port})
    const handshake = new EncryptedHandshake(socket)
    handshake.once("uninitialized", () => handshake.sendC0C1())
    handshake.once("handshake:done", async () => {
      const streamFactory = new StreamFactory(socket)
      const netConnection = streamFactory.netConnection
      try {
        await netConnection.connect({app, swfUrl, tcUrl, pageUrl})
        const [info, streamId] = await netConnection.createStream()
        const netStream = streamFactory.createNetStream(streamId)
        netStream.play('examplestream')
      } catch(error) {
        console.log(error)
      }
    })
  }
}

module.exports = RTMPSocket
