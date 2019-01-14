const { C1, C2 } = require('Handshake') 
const Handshake = require("./handshake")

class EncryptedHandshake extends Handshake {
  c1(s0) {
    return C1.create().encode()
  }
  c2(s1) {
    return C2.create(s1).encode()
  }
}

module.exports = EncryptedHandshake
