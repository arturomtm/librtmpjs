_Warning: this is a Work-in-Progress library_

# LIBRTMPJS

Librtmpjs is a set of entities and utils to establish a connection and grab resources from a Media Server using RTMP protocol. It targets Node.js and it is intented to be flexible and easily customizable. Despite it's not fully implemented, the next entities are available at this moment:

- Handshake
- NetConnection
- NetStream

A connection method is also provided:

`rtmp.connect(connectionOptions)`

so you can connect to a Net Stream:
```
const rtmp = require("librtmpjs")
const connectionOptions = require("./config.json")

try {
  const netStream = await rtmp.connect(connectionOptions)
  netStream.play("demoPlaypath")
} catch(e) {
  process.exit(1)
}
```

The connection options must, at least, include the parameters to establish a connection:

- `host`: the IP address for remote Media Server
- `port`: the port for remote Media Server, `1935` by default
- `app`: the remote application to connect to

To include in your own projects, just:

```
npm install --save librtmp
```

# Handshake

The process of Handshaking is the first step to establish a RTMP connection to the server after the socket has been connected. It consists of messages exchange between the part that starts the process, in this case the client (C0, C1 and C2), and server (S0, S1 and S2). Depending on what type of Handshake is being performed these messages can contain certain data.

At this moment, only two types of Handshakes are supported:

- **plain**: as described in the RFC, packets contains random data (C1) or are a echo of the counterpart's packets (C2)

- **digest**: packets contains a digest and a public key to verify it

By default, `rtmp.connect()` uses plain Handshake, but if it's needed to upgrade that, simply pass the handshake class as second argument to the method: 

```
const rtmp = require('rtmp')
const { DigestHandshake } = require('rtmp/handshake')
const connectionOptions = require('./config')

rtmp.connect(connectionOptions, DigestHandshake)
```

To create a new Handshake, simply extend the Handshake base class overriding the methods used to generate the client packets C0, C1 and C2:

- `Handshake.c0()`

  Not really needed to implement since C0 must be *always* the protocol version which is `0x03`. Other values will make the server to reject the connection. So it will return a buffer with a length of 1.

- `Handshake.c1(s0)`

  It receives the S0 packet from the server but it should be useless because it's like C0. This method must return a buffer with a size of 1536 bytes.

- `Handshake.c2(s1)`

  Once S1 has been received, it is available to this method to compose C2 package. It must be a buffer with a length of 1536 bytes too.

# NetConnection

NetConnection represents a connection to an application contained in a Media Server. The API for this corresponds to the methods described in the RFC:

- `netConnection.connect(options)`

  Once the socket has been established, connect to the Media Server application. The `options` argument can have the next properties:

  - `app`: the name of the application to connect to. If not present, `default` is the default value
  - `tcUrl`: mandatory, it is the URL of the server
  - `pageUrl`: URL of the web page from where the SWF file was loaded
  - `sfwUrl`: URL of the source SWF file making the connection

- `netConnection.createStream()`

  Request to the Media Server create a stream. It returns the full response as an array containing the `streamId`. This id should be used to instantiate the corresponding NetStream class.

- `netConnection.call()`

  Not implemented yet

- `netConnection.close()`
  
  Not described in RFC. Closes the connection to the Media Server.

To modify the behaviour of NetConnection, the desirable way is to extend it and override the methods that generate the commands for the API methods:

- `netConnection.getConnectCommand(options)`

  It receives the arguments that `connect()` method receives. It must return an object with not only the mandatory properties, like `tcUrl`, but also some information the server would need as specified in RFC. This includes: `flashver`, `fpad`, `audioCodecs`, `videoCodecs`, `videoFunction` and `objectEncoding`.

  The last one's value must match to the one's the AMF encoding library that NetConnection uses is encoding in. 

- `netConnection.getCreateStreamCommand()`

  It should return some info that server would eventually use for this command. At this moment, it's set to `null`.

# NetStream

NetStream represents the channel where media is sent. To control the flow, NetStream sends commands through its API. At this moment, the implemented methods are:

- `netStream.play(playpath)`

Also, NetStream has some properties to handle the media sent by the server

- `netStream.data`

  A readable stream where metadata is received.

- `netStream.video`

  Represents a video stream. Once the video data starts to flow, it emits the `"ready"` event: 

    ```
    video.on('ready', out => { out.pipe(process.stdout) })
    ```

  `"ready"` indicates when `netStream.video.out` is available for reading video tags from it. All these video tags can be multiplexed into a video container format such as `flv`. At this moment, `librtmpjs` provides a Stream Transform to do this. It is located at `src/message_stream/containers/flv`.

Again, as with NetConnection, the best way to modify the NetStream behaviour is to extend it and override the methods to generate the commands for the API methods:

- `netStream.getPlayCommand(streamName, commandObject, start, duration, reset)`

  It is invoked by `play()` method to get an array with the command options. Its arguments are:
  
    - `streamName`: the only mandatory argument.
    - `commandObject`: it doesn't really exist and should be `null`, but it's here for testing purposes.
    - `start`: optional, it's the start time in seconds
    - `duration`: optional, the duration of playback in seconds
    - `reset`: optional boolean to flush or not previous playlists

  The last three arguments are optional and it's strongly recommended to read the RFC for further info.