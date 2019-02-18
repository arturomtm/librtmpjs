// const NetStreamEncoder = require("./net_stream/encoder")
const Duplex = require("stream").Duplex
const AMF = require('amf')
const util = require('./util')

const NET_CONNECTION_CHUNK_FORMAT = 0

const MESSAGE_TYPE_DATA_AMF0 = 18,
      MESSAGE_TYPE_DATA_AMF3 = 15,
      MESSAGE_TYPE_SHARED_OBJECT_AMF0 = 19,
      MESSAGE_TYPE_SHARED_OBJECT_AMF3 = 16,
      MESSAGE_TYPE_AUDIO = 8,
      MESSAGE_TYPE_VIDEO = 9,
      MESSAGE_TYPE_AGGREGATE = 22

const AMF3_ENCODING = 3

const flashVer = "WIN 32,0,0,114"
const SUPPORT_VID_CLIENT_SEEK = 1 

class NetConnection extends Duplex { // NetStreamEncoder {

  constructor(options) {
    // super(NetConnection.NET_CONNECTION_STREAM_ID, options)
    super({ ...options, writableObjectMode: true })
    this.chunkStreamId = NetConnection.CHUNK_STREAM_ID
    this.id = NetConnection.NET_CONNECTION_STREAM_ID
    this.transactionId = 0
    this._commandHistory = [null]
    this.amf = new AMF.AMF0()
    // this.messageType = MessageStreamEncoder.MESSAGE_TYPE_COMMAND_AMF0
  }

  getMessageInfo(message, ...info) {
    return {
      id: this.id,
      typeId: this.getMessageType(),
      length: message.length
    }
  }

  getMessageType() {
    return {
      0: NetConnection.MESSAGE_TYPE_COMMAND_AMF0,
      3: NetConnection.MESSAGE_TYPE_COMMAND_AMF3
    }[this.amf.encoding]
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

  getTransactionId() {
    return ++this.transactionId
  }

  send(commandName, ...commandObjects) {
    const chunk = [commandName, this.getTransactionId(), ...commandObjects]
    const payload = this.amf.encode(...chunk)
    return new Promise((_result, _error) => {
      this._commandHistory[this.transactionId] = { _result, _error }
      this.push(payload)
    })
  }

  receive({ message }) {
    const [
      method,
      transactionId,
      ...eventData
    ] = this.amf.decode(message)
    this._commandHistory[transactionId][method](eventData)
  }

  _read() {}

  _write(chunk, encoding, done) {
    if (this.chunkStreamId === chunk.id) {
      this.receive(chunk)
    }
    done()
  }
}

NetConnection.CHUNK_STREAM_ID = 3
NetConnection.NET_CONNECTION_STREAM_ID = 0
NetConnection.MESSAGE_TYPE_COMMAND_AMF0 = 20 
NetConnection.MESSAGE_TYPE_COMMAND_AMF3 = 17

module.exports = NetConnection;
