const Writable = require('stream').Writable
const ChunkStream = require('../src/chunk_stream')
const NetConnection = require('../src/net_connection')
const netConnectionConfig = require('./mocks/net_connection.config')
const SocketStream = require('./mocks/socket_stream')
const clock = require('../src/services/time')

const chunkStream = new ChunkStream(NetConnection.NET_CONNECTION_CHUNK_STREAM_ID)
const netConnection = new NetConnection()
netConnection.clock = clock

netConnection.pipe(chunkStream.encoder).pipe(new Writable({
  write(chunk){
    console.log(chunk)
  }
}))

netConnection.connect(netConnectionConfig)
