'use strict'

const sinon = require('sinon')

/**
 * Mocking of an IPC-Emitter type.
 * @type {Object}
 */
module.exports = {
  marshallable: sinon.stub(),
  marshal: sinon.stub(),
  unmarshal: sinon.stub()
}
