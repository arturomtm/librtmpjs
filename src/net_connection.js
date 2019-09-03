const CommandStream = require('./message_stream/command')
const util = require('./util')

const flashVer = "WIN 32,0,0,114"
const SUPPORT_VID_CLIENT_SEEK = 1 

class NetConnection extends CommandStream {

  constructor() {
    super(NetConnection.NET_CONNECTION_STREAM_ID, NetConnection.CHUNK_STREAM_ID)
    this.transactionId = 0
  }

  connect({app = 'default', tcUrl = util.mandatoryParam('tcUrl'), pageUrl, swfUrl}, ...args) {
    const command = this.getConnectCommand({app, tcUrl, pageUrl, swfUrl})
    return this.send('connect', command, ...args)
  }

  call() {
    throw new Error('NetConnection.call() not implemented yet')
  }

  close() {
    throw new Error('NetConnection.close() is not defined in RFC')
  }

  createStream() {
    const command = this.getCreateStreamCommand(arguments)
    return this.send('createStream', command)
  }

  getConnectCommand(options) {
    const {app, tcUrl, pageUrl, swfUrl} = options
    const defaultOptions = {
      flashVer,
      fpad: false,
	    capabilities: 15,
	    audioCodecs: 3191,
	    videoCodecs: 252,
      videoFunction: SUPPORT_VID_CLIENT_SEEK,
      objectEncoding: this.amf.encoding
    }
    const commandObject = { app, tcUrl, ...defaultOptions }
    pageUrl && (commandObject.pageUrl = pageUrl)
    swfUrl && (commandObject.swfUrl = swfUrl)
    return commandObject
  }

  getCreateStreamCommand() {
    const commandObject = null
    return {commandObject}
  }
}

NetConnection.CHUNK_STREAM_ID = 3
NetConnection.NET_CONNECTION_STREAM_ID = 0

module.exports = NetConnection
