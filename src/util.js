function mandatoryParam(name) {
  throw new Error(`The parameter ${param} is mandatory`)
}

module.exports = {
  mandatoryParam
}