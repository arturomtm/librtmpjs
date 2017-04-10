const net = require('net')
const Handshake = require('./handshake')

class RTMPSocket {
  constructor({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}) {
    this.rtmpOptions = {app, swfUrl, tcUrl, pageUrl}
    const socket = net.connect({host, port})
    socket.once('connect', () => this.doHandshake(socket))
  }

  doHandshake(socket) {
    new Handshake(socket)
    .once("handshake:done", socket => this.doConnect(socket))
  }

  doConnect(socket) {
  }
}

module.exports = RTMPSocket
