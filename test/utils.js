'use strict'
/* eslint-env mocha */

const assert = require('assert')
const utils = require('../src/utils')

describe('Utilities', function () {
  describe('Scenario: Parsing payload', function () {
    describe('Given a non JSON parsable payload', function () {
      let payload = null

      beforeEach(function () {
        payload = '{ test'
      })

      describe('when parsing the payload', function () {
        it('should return null', function () {
          assert.strictEqual(utils.parsePayload(payload), null)
        })
      })
    })

    describe('Given a JSON parsable payload', function () {
      let payload = null

      describe('without an \'event\' field', function () {
        beforeEach(function () {
          payload = '{}'
        })

        describe('when parsing the payload', function () {
          it('should return null', function () {
            assert.strictEqual(utils.parsePayload(payload), null)
          })
        })
      })

      describe('with an \'event\' field', function () {
        describe('and without an \'args\' field', function () {
          beforeEach(function () {
            payload = JSON.stringify({
              event: 'click'
            })
          })

          describe('when parsing the payload', function () {
            it('should return an object having the \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload.event, 'click')
            })

            it('should return an object having the \'args\' field as an empty array', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload.args, [])
            })
          })
        })

        describe('and with an non-array \'args\' field', function () {
          beforeEach(function () {
            payload = JSON.stringify({
              event: 'click',
              arg: 1
            })
          })

          describe('when parsing the payload', function () {
            it('should return an object having the \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload.event, 'click')
            })

            it('should return an object having the \'args\' field as an empty array', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload.args, [])
            })
          })
        })

        describe('and with an array \'args\' field', function () {
          beforeEach(function () {
            payload = JSON.stringify({
              event: 'click',
              args: [1, 2]
            })
          })

          describe('when parsing the payload', function () {
            it('should return an object having the \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload.event, 'click')
            })

            it('should return an object having the \'args\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload.args, [1, 2])
            })
          })
        })
      })
    })
  })

  describe('Scenario: Checking if a process is a valid worker process', function () {
    describe('Given a process object', function () {
      let processMock = null

      beforeEach(function () {
        processMock = {}
      })

      describe('with the \'send()\' & \'on\' functions & a \'pid\' numeric field', function () {
        beforeEach(function () {
          processMock.pid = 1
          processMock.send = function () {}
          processMock.on = function () {}
        })

        describe('when checking if it is a valid worker process', function () {
          it('should indicate that it is', function () {
            assert.strictEqual(utils.isValidWorker(processMock), true)
          })
        })
      })

      describe('without a \'send()\' function', function () {
        beforeEach(function () {
          processMock.pid = 1
          processMock.on = function () {}
          delete processMock.send
        })

        describe('when checking if it is a valid worker process', function () {
          it('should indicate that it is not', function () {
            assert.strictEqual(utils.isValidWorker(processMock), false)
          })
        })
      })

      describe('without an \'on()\' function', function () {
        beforeEach(function () {
          processMock.pid = 1
          processMock.send = function () {}
          delete processMock.on
        })

        describe('when checking if it is a valid worker process', function () {
          it('should indicate that it is not', function () {
            assert.strictEqual(utils.isValidWorker(processMock), false)
          })
        })
      })

      describe('without a \'pid\' numeric field', function () {
        beforeEach(function () {
          processMock.send = function () {}
          processMock.on = function () {}
          delete processMock.pid
        })

        describe('when checking if it is a valid worker process', function () {
          it('should indicate that it is not', function () {
            assert.strictEqual(utils.isValidWorker(processMock), false)
          })
        })
      })
    })
  })
})
