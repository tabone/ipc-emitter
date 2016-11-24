'use strict'
/* eslint-env mocha */

const assert = require('assert')
const utils = require('../src/utils')
const marshaller = require('../src/marshaller')
const testType = require('./libs/testType')

describe('Marshaller Module', function () {
  const testTypeKey = 'testType'
  const fields = {
    type: utils.prefix('type'),
    data: utils.prefix('data')
  }

  beforeEach(function () {
    testType.marshal.reset()
    testType.unmarshal.reset()
    testType.marshallable.reset()
  })

  before(function () {
    marshaller.types = {
      [ testTypeKey ]: testType
    }
  })

  describe('Scenario: Marshalling non-marshallable arguments', function () {
    describe('Given a non-marshallable arg', function () {
      let arg = null

      beforeEach(function () {
        testType.marshallable.returns(false)
        arg = 'non-marshallable'
      })

      describe('when marshalled', function () {
        let result = null

        beforeEach(function () {
          result = marshaller.marshal([arg])
        })

        it('should return the argument as it is', function () {
          assert.deepStrictEqual([arg], result)
        })
      })
    })
  })

  describe('Scenario: Marshalling marshallable arguments', function () {
    describe('Given a marshallable arg', function () {
      let arg = null
      let marshalledArg = null

      beforeEach(function () {
        testType.marshallable.returns(true)
        arg = 'marshallable'
        marshalledArg = {}
        testType.marshal.returns(marshalledArg)
      })

      describe('when marshalled', function () {
        let result = null

        beforeEach(function () {
          result = marshaller.marshal([arg])
        })

        it('should return a marshalled version of the argument', function () {
          assert.deepStrictEqual(result, [{
            [ fields.type ]: testTypeKey,
            [ fields.data ]: marshalledArg
          }])
        })
      })
    })
  })

  describe('Scenario: Unmarshalling non-object arguments', function () {
    describe('Given a non-object arg', function () {
      let arg = null

      beforeEach(function () {
        arg = 1
      })

      describe('when unmarshalled', function () {
        let result = null

        beforeEach(function () {
          result = marshaller.unmarshal([arg])
        })

        it('should not try to unmarshal the arg', function () {
          assert.strictEqual(testType.unmarshal.callCount, 0)
        })

        it('should return the arg as it is', function () {
          assert.deepStrictEqual([arg], result)
        })
      })
    })
  })

  describe('Scenario: Unmarshalling null arguments', function () {
    describe('Given a null arg', function () {
      let arg = null

      describe('when unmarshalled', function () {
        let result = null

        beforeEach(function () {
          result = marshaller.unmarshal([arg])
        })

        it('should return the arg as it is', function () {
          assert.deepStrictEqual([arg], result)
        })
      })
    })
  })

  describe('Scenario: Unmarshalling a non marshalled object', function () {
    describe('Given an object arg without the prefixed \'type\' and \'data\' fields', function () {
      let arg = null

      beforeEach(function () {
        arg = {}
      })

      describe('when unmarshalled', function () {
        let result = null

        beforeEach(function () {
          result = marshaller.unmarshal([arg])
        })

        it('should not try to unmarshal the arg', function () {
          assert.strictEqual(testType.unmarshal.callCount, 0)
        })

        it('should return the arg as it is', function () {
          assert.deepStrictEqual([arg], result)
        })
      })
    })

    describe('Given an object arg with a prefixed \'type\' field', function () {
      let arg = null

      beforeEach(function () {
        arg = {
          [ fields.type ]: testTypeKey
        }
      })

      describe('but without a prefixed \'data\' field', function () {
        describe('when unmarshalled', function () {
          let result = null

          beforeEach(function () {
            result = marshaller.unmarshal([arg])
          })

          it('should not try to unmarshal the arg', function () {
            assert.strictEqual(testType.unmarshal.callCount, 0)
          })

          it('should return the arg as it is', function () {
            assert.deepStrictEqual([arg], result)
          })
        })
      })
    })

    describe('Given an object arg with a prefixed \'data\' field', function () {
      let arg = null

      beforeEach(function () {
        arg = {
          [ fields.data ]: testTypeKey
        }
      })

      describe('but without a prefixed \'type\' field', function () {
        describe('when unmarshalled', function () {
          let result = null

          beforeEach(function () {
            result = marshaller.unmarshal([arg])
          })

          it('should not try to unmarshal the arg', function () {
            assert.strictEqual(testType.unmarshal.callCount, 0)
          })

          it('should return the arg as it is', function () {
            assert.deepStrictEqual([arg], result)
          })
        })
      })
    })
  })

  describe('Scenario: Unmarshalling a marshalled object with an invalid type', function () {
    describe('Given a marshal object arg', function () {
      let arg = null

      beforeEach(function () {
        arg = {
          [ fields.type ]: '',
          [ fields.data ]: {}
        }
      })

      describe('which has a non-supported type', function () {
        beforeEach(function () {
          arg[fields.type] = 'not-supported'
        })

        describe('when unmarshalled', function () {
          let result = null

          beforeEach(function () {
            result = marshaller.unmarshal([arg])
          })

          it('should not try to unmarshal the arg', function () {
            assert.strictEqual(testType.unmarshal.callCount, 0)
          })

          it('should return the arg as it is', function () {
            assert.deepStrictEqual([arg], result)
          })
        })
      })
    })
  })

  describe('Scenario: Unmarshalling a valid marshalled object', function () {
    describe('Given a marshal object arg', function () {
      let arg = null
      let argData = null
      let unmarshalledArg = null

      beforeEach(function () {
        argData = {}
        unmarshalledArg = {}

        testType.unmarshal.returns(unmarshalledArg)

        arg = {
          [ fields.type ]: '',
          [ fields.data ]: argData
        }
      })

      describe('which has a supported type', function () {
        beforeEach(function () {
          arg[fields.type] = testTypeKey
        })

        describe('when unmarshalled', function () {
          let result = null

          beforeEach(function () {
            result = marshaller.unmarshal([arg])
          })

          it('should try to unmarshal the arg', function () {
            assert.strictEqual(testType.unmarshal.callCount, 1)
          })

          it('should invoke the \'marshal\' method of the type with the prefixed \'data\' field value', function () {
            assert.strictEqual(testType.unmarshal.getCall(0).args[0], argData)
          })

          it('should return the unmarshalled version of the arg', function () {
            assert.deepStrictEqual(result, [unmarshalledArg])
          })
        })
      })
    })
  })
})
