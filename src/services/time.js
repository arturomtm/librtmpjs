'use strict'

const MAX_TIME = 0xFFFFFFFF

let epoch = Date.now()

function resetEpoch() {
  epoch = Date.now()
}

function time(){
  let t = Date.now() - epoch
  if (t < MAX_TIME) {
    return t
  } else {
    resetEpoch()
    return time()
  }
}

resetEpoch()

module.exports = { 
  time
}