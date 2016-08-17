'use strict'
/* eslint-env mocha */

const assert = require('assert')
const utils = require('../src/utils')

describe('Utilities', function () {
  describe('Scenario: Prefixing words', function () {
    describe('Given a word', function () {
      let word = null

      beforeEach(function () {
        word = 'luca'
      })

      describe('when prefixed', function () {
        let prefixedWord = null

        beforeEach(function () {
          prefixedWord = utils.prefix(word)
        })

        it('should be prefixed with \'IPCE_\'', function () {
          assert.strictEqual(prefixedWord, `IPCE_${word}`)
        })
      })
    })
  })

  describe('Scenario: Parsing payload', function () {
    const eventKey = utils.prefix('event')
    const argsKey = utils.prefix('args')

    describe('Given a payload which is not an object', function () {
      let payload = null

      beforeEach(function () {
        payload = '{ "IPCE_event": "click" }'
      })

      describe('when parsing the payload', function () {
        it('should return null', function () {
          assert.strictEqual(utils.parsePayload(payload), null)
        })
      })
    })

    describe('Given a payload who is an object', function () {
      let payload = null

      describe('without a prefixed \'event\' field', function () {
        beforeEach(function () {
          payload = {}
        })

        describe('when parsing the payload', function () {
          it('should return null', function () {
            assert.strictEqual(utils.parsePayload(payload), null)
          })
        })
      })

      describe('with an prefixed \'event\' field', function () {
        describe('and without an prefixed \'args\' field', function () {
          beforeEach(function () {
            payload[eventKey] = 'click'
          })

          describe('when parsing the payload', function () {
            it('should return an object having the prefixed \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload[eventKey], 'click')
            })

            it('should return an object having the prefixed \'args\' field as an empty array', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload[argsKey], [])
            })
          })
        })

        describe('and with a non-array prefixed \'args\' field', function () {
          beforeEach(function () {
            payload[eventKey] = 'click'
            payload[argsKey] = 1
          })

          describe('when parsing the payload', function () {
            it('should return an object having the prefixed \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload[eventKey], 'click')
            })

            it('should return an object having the prefixed \'args\' field as an empty array', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload[argsKey], [])
            })
          })
        })

        describe('and with an array prefixed \'args\' field', function () {
          beforeEach(function () {
            payload[eventKey] = 'click'
            payload[argsKey] = [1, 2]
          })

          describe('when parsing the payload', function () {
            it('should return an object having the prefixed \'event\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.strictEqual(parsedPayload[eventKey], 'click')
            })

            it('should return an object having the prefixed \'args\' field specified in the payload', function () {
              const parsedPayload = utils.parsePayload(payload)
              assert.deepStrictEqual(parsedPayload[argsKey], [1, 2])
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
