'use strict'
/* eslint-env mocha */

const assert = require('assert')
const errorType = require('../../src/types/error')

describe('Error Type', function () {
  describe('Scenario: Checking whether an arg can be marshalled using the Error Type', function () {
    describe('Given an Error arg', function () {
      let arg = null

      beforeEach(function () {
        arg = new Error('woops')
      })

      describe('when checking if it is marshallable with Error Type', function () {
        let result = null

        beforeEach(function () {
          result = errorType.marshallable(arg)
        })

        it('should indicate that it is', function () {
          assert.deepEqual(result, true)
        })
      })
    })

    describe('Given an arg whose a sub-type of Error', function () {
      let arg = null

      beforeEach(function () {
        arg = new RangeError('woops')
      })

      describe('when checking if it is marshallable with Error Type', function () {
        let result = null

        beforeEach(function () {
          result = errorType.marshallable(arg)
        })

        it('should indicate that it is', function () {
          assert.deepEqual(result, true)
        })
      })
    })

    describe('Given a non Error arg', function () {
      let arg = null

      beforeEach(function () {
        arg = 1
      })

      describe('when checking if it is marshallable with Error Type', function () {
        let result = null

        beforeEach(function () {
          result = errorType.marshallable(arg)
        })

        it('should indicate that it is not', function () {
          assert.deepEqual(result, false)
        })
      })
    })
  })

  describe('Scenario: Marshalling an Error object', function () {
    describe('Given an Error arg', function () {
      let arg = null
      let message = null

      beforeEach(function () {
        message = 'woops'
        arg = new RangeError(message)
      })

      describe('with a custom name', function () {
        beforeEach(function () {
          arg.name = 'custom error name'
        })

        describe('when marshalled', function () {
          let result = null

          beforeEach(function () {
            result = errorType.marshal(arg)
          })

          describe('should return an object having', function () {
            it('\'constructor\' field value set to the type of the Error instance', function () {
              assert.deepEqual(result.constructor, 'RangeError')
            })

            it('\'name\' field value set to the custom name assigned to the Error instance', function () {
              assert.deepEqual(result.name, arg.name)
            })

            it('\'stack\' field value set to the stack of the Error instance', function () {
              assert.deepEqual(result.stack, arg.stack)
            })

            it('\'message\' field value set to the custom message assigned to the Error instance', function () {
              assert.deepEqual(result.message, arg.message)
            })
          })
        })
      })
    })
  })

  describe('Scenario: Unmarshalling an Error object', function () {
    describe('Given a valid marshalled Error arg', function () {
      let arg = null

      beforeEach(function () {
        arg = {
          constructor: 'RangeError',
          name: 'custom error name',
          message: 'woops',
          stack: 'this is stack'
        }
      })

      describe('when unmarshalled', function () {
        let result = null

        beforeEach(function () {
          result = errorType.unmarshal(arg)
        })
        describe('should return an object', function () {
          it('whose type is Error', function () {
            assert(result instanceof Error)
          })

          it('whose name is set to the name specified in the marshalled object', function () {
            assert.strictEqual(result.name, arg.name)
          })

          it('whose stack is set to the stack specified in the marshalled object', function () {
            assert.strictEqual(result.stack, arg.stack)
          })

          it('whose message is set to the message specified in the marshalled object', function () {
            assert.strictEqual(result.message, arg.message)
          })
        })
      })
    })

    describe('Given an invalid marshalled Error arg', function () {
      let arg = null

      beforeEach(function () {
        arg = {
          constructor: 'InvalidName',
          name: 'custom error name',
          message: 'woops',
          stack: 'this is stack'
        }
      })

      describe('when unmarshalled', function () {
        let result = null

        beforeEach(function () {
          result = errorType.unmarshal(arg)
        })

        it('should return the same object', function () {
          assert.deepStrictEqual(arg, result)
        })
      })
    })
  })
})
