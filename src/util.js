function generateRandomBuffer(len){
  var packet = Buffer.alloc(len);
  for (var i = 0; i < len; i++){
    var byte = Math.floor(Math.random() * 256);
    packet.writeUInt8(byte, i);
  }
  return packet;
}

function mandatoryParam(name) {
  throw new Error(`The parameter ${name} is mandatory`)
}

function codeToEvent(code) {
  const [, command, action] = code.toLowerCase().split('.')
  return `${command}:${action}`
}

module.exports = {
  codeToEvent,
  generateRandomBuffer,
  mandatoryParam
}