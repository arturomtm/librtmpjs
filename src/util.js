function generateRandomBuffer(len){
  var packet = new Buffer(len);
  for (var i = 0; i < len; i++){
    var byte = Math.floor(Math.random() * 256);
    packet.writeUInt8(byte, i);
  }
  return packet;
}

function mandatoryParam(name) {
  throw new Error(`The parameter ${param} is mandatory`)
}

module.exports = {
  generateRandomBuffer,
  mandatoryParam
}