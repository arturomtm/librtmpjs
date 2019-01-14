const { EventEmitter } = require("events")
const { generateRandomBuffer } = require('../util')
const clock = require("../services/time");

const RANDOM_LENGTH = 1536,
      PACKETS_LENGTHS = [1, RANDOM_LENGTH, RANDOM_LENGTH],
      PROTOCOL_VERSION = 0x03,
      INITIAL_STATE = 0;

class Handshake extends EventEmitter {
  constructor(socket) {
    super()
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

  _resetBuffer() {
    this._buffer = new Buffer(0)
  }

  c0() {
    const packet = new Buffer(1)
    packet.writeUInt8(PROTOCOL_VERSION)
    return packet
  }
  c1(s0) {
    var packet = generateRandomBuffer(RANDOM_LENGTH);
    // clock.setEpoch();
    packet.writeUInt32BE(clock.time(), 0)
    packet.writeUInt32BE(0, 4);
    return packet
  }
  c2(s1) {
    s1.writeUInt32BE(clock.time(), 4);
    return s1
  }

  sendC0() {
    const packet = this.c0()
    this.socket.write(packet)
  }
  sendC1(s0) {
    const packet = this.c1(s0)
    this.socket.write(packet)
  }
  sendC2(s1) {
    const packet = this.c2(s1)
    this.socket.write(packet)
  }
  sendC0C1() {
    const packet = Buffer.concat([this.c0(), this.c1()])
    this.socket.write(packet)
  }

  onS0(s0) {
    if (s0[0] !== PROTOCOL_VERSION)
      this.emit('error', new Error("Protocol version unknown"))
  }
  onS1(s1) {
    this.sendC2(s1)
    this.emit('ack:sent')
  }
  onS2(s2) {}

  _onData(data) {
    if (!data.length) return;

    var packetLength = PACKETS_LENGTHS[this.state],
        len = packetLength - this._buffer.length

    this._buffer = Buffer.concat([this._buffer, data.slice(0, len)])
    if (this._buffer.length === packetLength) {
      this.emit(`handshake:s${this.state++}`, Buffer.from(this._buffer))
      this._resetBuffer()
    }
    this._onData(data.slice(len));
  }
}

exports.Handshake = Handshake;
