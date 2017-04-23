const Writable = require('stream').Writable
const ChunkStream = require('../src/chunk_stream')
const MessageStream = require('./mocks/message_stream')
const SocketStream = require('./mocks/socket_stream')

const controlStream = new ChunkStream(ChunkStream.CONTROL_STREAM_ID)
const netConnection = new MessageStream(MessageStream.NET_CONNECTION_ID)

netConnection.pipe(controlStream.encoder).pipe(new Writable({
  write(chunk){
    console.log(chunk)
  }
}))


const socket = new SocketStream()

socket.pipe(controlStream.decoder).pipe(new Writable({
  write(chunk){
    console.log(chunk)
  }
}))
