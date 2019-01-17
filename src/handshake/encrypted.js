const { C1, C2, S1 } = require('Handshake/dist')
const Handshake = require("./rfc")

class EncryptedHandshake extends Handshake {
  c1(s0) {
    return C1.create().encode()
  }
  c2(s1) {
    const _s1 = S1.fromBuffer(s1)
    return C2.create(_s1).encode()
  }
}

module.exports = EncryptedHandshake
