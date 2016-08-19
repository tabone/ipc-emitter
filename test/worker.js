'use strict'
/* eslint-env mocha */

const path = require('path')
const events = require('events')
const assert = require('assert')
const sinon = require('sinon')
const utils = require('../src/utils')
const ipce = require('../index')

describe('Worker Module', function () {
  const fields = {
    pid: utils.prefix('pid'),
    event: utils.prefix('event'),
    args: utils.prefix('args')
  }

  beforeEach(function () {
    // There is some code that should run when the worker is first required. So
    // in order for this code to run in each test case, the cache is removed.
    delete require.cache[path.join(__dirname, '../src/worker.js')]

    // Reset listeners.
    process.removeAllListeners()
  })

  describe('Node Compatibility Check', function () {
    describe('Global process object', function () {
      it('should not have the \'.send()\' function', function () {
        assert.strictEqual(process.send, undefined)
      })
    })
  })

  describe('Scenario: Requiring a Worker IPC-Emitter', function () {
    beforeEach(function () {
      sinon.stub(console, 'warn')
    })

    afterEach(function () {
      console.warn.restore()
    })

    describe('Given a master process (non-forked environment)', function () {
      describe('when getting the Worker IPC-Emitter', function () {
        it('should warn the user', function () {
          ipce.worker
          assert.strictEqual(console.warn.calledOnce, true)
        })
      })
    })

    describe('Given a worker process (forked environment)', function () {
      beforeEach(function () {
        process.send = function () {}
        sinon.stub(process, 'on')
      })

      afterEach(function () {
        delete process.send
        process.on.restore()
      })

      describe('when getting the Worker IPC-Emitter', function () {
        let worker = null

        beforeEach(function () {
          ;({worker} = ipce)
        })

        it('should listen for the process \'message\' event', function () {
          assert.strictEqual(process.on.calledOnce, true)
          assert.strictEqual(process.on.getCall(0).args[0], 'message')
        })

        it('should always return the same object', function () {
          const {worker: workerOne} = ipce
          assert.strictEqual(workerOne, worker)
        })

        it('should not warn the user', function () {
          assert.strictEqual(console.warn.calledOnce, false)
        })
      })
    })
  })

  describe('Scenario: Emitting an event from Worker IPC-Emitter', function () {
    describe('Given a Worker IPC-Emitter', function () {
      let worker = null
      let listener = null

      beforeEach(function () {
        process.send = sinon.stub()
        listener = sinon.stub()
        ;({worker} = ipce)
        worker.on('click', listener)
      })

      afterEach(function () {
        delete process.send
      })

      describe('when emitting an event from the Worker IPC-Emitter', function () {
        beforeEach(function () {
          worker.emit('click', 1, 2)
        })

        it('should trigger the workers listeners for that event', function () {
          assert.strictEqual(listener.calledOnce, true)
          assert.deepStrictEqual(listener.getCall(0).args, [1, 2])
        })

        it('should send a payload to the master process', function () {
          const expectedPayload = {
            [ fields.pid ]: process.pid,
            [ fields.event ]: 'click',
            [ fields.args ]: [1, 2]
          }

          const payload = process.send.getCall(0).args[0]

          assert.strictEqual(process.send.calledOnce, true)
          assert.deepStrictEqual(payload, expectedPayload)
        })
      })
    })
  })

  describe('Scenario: Retreiving invalid payloads from the master process', function () {
    describe('Given a Worker IPC-Emitter', function () {
      beforeEach(function () {
        process.send = function () {}
        ipce.worker
      })

      afterEach(function () {
        delete process.send
      })

      describe('when an invalid payload is retreived from the master process', function () {
        let payload = null

        beforeEach(function () {
          payload = '{"invalid": "payload"}'
        })

        it('should not try to trigger the workers listeners', function () {
          sinon.spy(events.prototype, 'emit')
          process.emit('message', payload)
          assert.strictEqual(events.prototype.emit.callCount, 1)
          events.prototype.emit.restore()
        })
      })
    })
  })

  describe('Scenario: Retreiving valid payloads from the master process', function () {
    describe('Given a Worker IPC-Emitter', function () {
      let worker = null
      let listener = null

      beforeEach(function () {
        process.send = function () {}
        listener = sinon.stub()
        ;({worker} = ipce)
        worker.on('click', listener)
      })

      afterEach(function () {
        delete process.send
      })

      describe('when a valid payload is retreived from the master process', function () {
        let payload = null

        beforeEach(function () {
          payload = {
            [ fields.event ]: 'click',
            [ fields.args ]: [1, 2]
          }

          process.emit('message', payload)
        })

        it('should trigger the workers listeners for the event emitted', function () {
          assert.strictEqual(listener.calledOnce, true)
          assert.deepStrictEqual(listener.getCall(0).args, [1, 2])
        })
      })
    })
  })
})
