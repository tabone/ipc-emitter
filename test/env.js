'use strict'
/* eslint-env mocha */

const assert = require('assert')

describe('Test Environment', function () {
  describe('Node Compatibility Check', function () {
    describe('Global process object', function () {
      it('should not have the \'.send()\' function', function () {
        assert.strictEqual(process.send, undefined)
      })
    })
  })
})
