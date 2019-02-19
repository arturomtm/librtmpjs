const AMF = require('amf')
const CommandStream = require('./command_stream')
const util = require('./util')

const NET_CONNECTION_CHUNK_FORMAT = 0

const MESSAGE_TYPE_DATA_AMF0 = 18,
      MESSAGE_TYPE_DATA_AMF3 = 15,
      MESSAGE_TYPE_SHARED_OBJECT_AMF0 = 19,
      MESSAGE_TYPE_SHARED_OBJECT_AMF3 = 16,
      MESSAGE_TYPE_AUDIO = 8,
      MESSAGE_TYPE_VIDEO = 9,
      MESSAGE_TYPE_AGGREGATE = 22

const flashVer = "WIN 32,0,0,114"
const SUPPORT_VID_CLIENT_SEEK = 1 

class NetConnection extends CommandStream {

  constructor() {
    super(NetConnection.NET_CONNECTION_STREAM_ID, NetConnection.CHUNK_STREAM_ID)
  }

  connect({app = 'default', tcUrl = util.mandatoryParam('tcUrl'), pageUrl, swfUrl}) {
    const command = this.getConnectCommand({app, tcUrl, pageUrl, swfUrl})
    return this.send('connect', command)
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

module.exports = NetConnection;
