const net = require('net')
const { PlainHandshake } = require('./handshake')
const StreamFactory = require('./stream_factory')

const connect = async ({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}, Handshake = PlainHandshake) =>
  new Promise((resolve, reject) => {
    const socket = net.connect({host, port})
    const handshake = new Handshake(socket)
    handshake.once("uninitialized", () => handshake.sendC0C1())
    handshake.once("handshake:done", async () => {
      const streamFactory = new StreamFactory(socket)
      const netConnection = streamFactory.netConnection
      try {
        await netConnection.connect({app, swfUrl, tcUrl, pageUrl})
        // TODO: maybe, createStream could have a hook to return a NetStream instance
        const [, streamId] = await netConnection.createStream()
        resolve(streamFactory.createNetStream(streamId))
      } catch(e) {
        reject(e)
      }
    })
  })

module.exports = {
  connect
}
