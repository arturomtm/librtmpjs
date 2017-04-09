const net = require('net')

class RTMPSocket {
  constructor({host = 'localhost', port = 1935, app, swfUrl, tcUrl, pageUrl} = {}) {
    this.rtmpOptions = {app, swfUrl, tcUrl, pageUrl}
    const socket = net.connect({host, port})
    socket.once('connect', () => this.doHandshake(socket))
  }

  doHandshake(socket) {
  }
}

module.exports = RTMPSocket

