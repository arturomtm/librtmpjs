var EventEmitter = require("events").EventEmitter,
    inherits = require("util").inherits;

const RANDOM_LENGTH = 1536,
      PACKETS_LENGTHS = [1, RANDOM_LENGTH, RANDOM_LENGTH],
      RANDOM_OFFSET = 8,
      PROTOCOL_VERSION = 0x03,
      INITIAL_STATE = 0;

var clock = require("../services/time");
/*
class Handshake extends EventEmitter {
  constructor(socket) {
    super()
    this.state = INITIAL_STATE
    socket.on("data", data => this._onData(data))
    //this.once("handshake:s0", s0 => socket.write(this.c1(s0)))
    this.once("handshake:s1", s1 => socket.write(this.c2(s1)))
    this.once("handshake:s2", s2 => socket.removeAllListeners())
    socket.write(this.c0c1())
  }

  c0() {
    return new Buffer([PROTOCOL_VERSION])
  }

  c1(s0) {
    const packet = generateRandom(RANDOM_LENGTH)
    packet.writeUInt32BE(clock.time(), 0);
    packet.writeUInt32BE(0, 4);
    return packet
  }

  c0c1() {
    return Buffer.concat(this.c0(), this.c1())
  }

  c2(s1) {
    return s1
  }
}
*/
function Handshake(socket) {
  EventEmitter.call(this);
  this.socket = socket;
  this.state = INITIAL_STATE;
  this._resetBuffer()

  const _onData = data => this._onData(data)
  socket.on("data", _onData)
  socket.once("connect", () => this.emit("uninitialized"))
  this.once('handshake:s0', s0 => this.onS0(s0))
  this.once("handshake:s1", s1 => this.onS1(s1))
  this.once("handshake:s2", () => {
    socket.removeListener("data", _onData)
    this.emit("handshake:done", socket);
    this.socket = null
  })
}
inherits(Handshake, EventEmitter);

Handshake.prototype._resetBuffer = function() {
  this._buffer = new Buffer(0)
}

Handshake.prototype.c0 = function() {
  const packet = new Buffer(1)
  packet.writeUInt8(PROTOCOL_VERSION)
  return packet
}
Handshake.prototype.c1 = function() {
  var packet = generateRandom(RANDOM_LENGTH);
  // clock.setEpoch();
  packet.writeUInt32BE(clock.time(), 0)
  packet.writeUInt32BE(0, 4);
  return packet
}
Handshake.prototype.c2 = function(s1) {
  s1.writeUInt32BE(clock.time(), 4);
  return s1
}

Handshake.prototype.sendC0C1 = function() {
  const packet = Buffer.concat([this.c0(), this.c1()])
  this.socket.write(packet)
}
Handshake.prototype.sendC2 = function(s1) {
  const packet = this.c2(s1)
  this.socket.write(packet)
}

Handshake.prototype.onS0 = function(s0) {
  if (s0[0] !== PROTOCOL_VERSION)
    this.emit('error', new Error("Protocol version unknown"))
}
Handshake.prototype.onS1 = function(s1) {
  this.sendC2(s1)
  this.emit('ack:sent')
}
Handshake.prototype.onS2 = function(s2) {
}

Handshake.prototype._onData = function(data) {
  if (!data.length) return;
  
  var packetLength = PACKETS_LENGTHS[this.state],
      len = packetLength - this._buffer.length

  this._buffer = Buffer.concat([this._buffer, data.slice(0, len)])
  if (this._buffer.length === packetLength) {
    this.emit(`handshake:s${this.state++}`, Buffer.from(this._buffer))
    this._resetBuffer()
  }
  this._onData(data.slice(len));
};

function generateRandom(len){
  var packet = new Buffer(len);
  for (var i = 0; i < len; i++){
    var byte = Math.floor(Math.random() * 256);
    packet.writeUInt8(byte, i);
  }
  return packet;
}

exports.Handshake = Handshake;
