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
  socket.on("data", this._onData.bind(this));
  this.state = INITIAL_STATE;
  this.S0 = new Buffer(0)
  this.S1 = new Buffer(0)
  this.S2 = new Buffer(0)
  this.once("handshake:s1", this.sendC2.bind(this));
  this.once("handshake:s2", this._done.bind(this));
  this.emit("handshake:start");
  this.sendC0C1();
}
inherits(Handshake, EventEmitter);

Handshake.prototype.sendC0 = function() {
  var packet = new Buffer([PROTOCOL_VERSION]);
  this.socket.write(packet);
};

Handshake.prototype.receiveS0 = function() {
  if (this.S0[0] !== PROTOCOL_VERSION) throw new Error("Protocol version unknown");
  return true;
};

Handshake.prototype.sendC1 = function() {
  var packet = generateRandom(RANDOM_LENGTH);
  clock.setEpoch();
  packet.writeDoubleBE(Date.now(), 0);
  packet.writeUInt32BE(0, 4);
  this.socket.write(packet);
};

Handshake.prototype.receiveS1 = function() {
  return true;
};

Handshake.prototype.sendC0C1 = function() {
  var packet = generateRandom(RANDOM_LENGTH + 1);
  packet.writeUInt8(PROTOCOL_VERSION)
  packet.writeUInt32BE(clock.time(), 1);
  packet.writeUInt32BE(0, 5);
  this.socket.write(packet);
};

Handshake.prototype.sendC2 = function() {
  //this.S1.writeUInt32BE(clock.time(), 4);
  console.log()
  this.socket.write(this.S1);
};

Handshake.prototype.receiveS2 = function() {
  return true;
};

Handshake.prototype._onData = function(data) {
  if (!data.length) return;
  
  var checkPacketFor = function(state){ return this["receive" + state].call(this); }.bind(this);
  console.log("DATA", data)
  var state = "S" + this.state,
      len = PACKETS_LENGTHS[this.state] - this[state].length;

  this[state] = Buffer.concat([this[state], data.slice(0, len)]);
  if (this[state].length === PACKETS_LENGTHS[this.state]  && checkPacketFor(state)) {
    this.emit("handshake:s" + this.state++);
  }
  this._onData(data.slice(len));
};

Handshake.prototype._done = function _done() {
  //this.socket.removeListener("data", this._onData);
  this.socket.removeAllListeners();
  this.emit("handshake:done", this.socket);
  this.socket = null;
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
