'use strict'
/* eslint-env mocha */

const events = require('events')
const assert = require('assert')
const sinon = require('sinon')
const utils = require('./libs/utils')
const ipce = require('../index')

describe('Master Module', function () {
  describe('Scenario: Requiring the Master IPC-Emitter', function () {
    describe('When getting a Master IPC-Emitter', function () {
      it('should always return a different object', function () {
        const {master: masterOne} = ipce
        const {master: masterTwo} = ipce

        assert.notStrictEqual(masterOne, masterTwo)
      })
    })
  })

  describe('Scenario: Acknowledging new workers', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
        sinon.stub(console, 'warn')
      })

      afterEach(function () {
        console.warn.restore()
      })

      describe('and multiple valid worker processes', function () {
        let workerOne = null
        let workerTwo = null

        beforeEach(function () {
          workerOne = utils.mockChildProcess()
          workerTwo = utils.mockChildProcess()

          sinon.stub(workerOne, 'on')
          sinon.stub(workerTwo, 'on')
        })

        describe('when acknowledging the worker processes', function () {
          beforeEach(function () {
            master.ack(workerOne, workerTwo)
          })

          it('should create an array in the master instance to store the workers', function () {
            assert.strictEqual(master.hasOwnProperty('__workers'), true)
          })

          it('should store the valid workers in the newly created array', function () {
            assert.strictEqual(master.__workers.length, 2)
            assert.strictEqual(!!~master.__workers.indexOf(workerOne), true)
            assert.strictEqual(!!~master.__workers.indexOf(workerTwo), true)
          })

          it('should listen for the acknowledged workers \'message\' event', function () {
            assert.strictEqual(workerOne.on.getCall(0).args[0], 'message')
            assert.strictEqual(workerTwo.on.getCall(0).args[0], 'message')
          })

          it('should not log any warnings', function () {
            assert.strictEqual(console.warn.called, false)
          })
        })
      })

      describe('and multiple invalid worker processes', function () {
        let workerOne = null
        let workerTwo = null

        beforeEach(function () {
          workerOne = {
            on: sinon.stub()
          }

          workerTwo = {
            on: sinon.stub()
          }
        })

        describe('when acknowledging the worker processes', function () {
          beforeEach(function () {
            master.ack(workerOne, workerTwo)
          })

          it('should create an array in the master instance to store the workers', function () {
            assert.strictEqual(master.hasOwnProperty('__workers'), true)
          })

          it('should not store the invalid workers in the newly created array', function () {
            assert.strictEqual(master.__workers.length, 0)
            assert.strictEqual(!!~master.__workers.indexOf(workerOne), false)
            assert.strictEqual(!!~master.__workers.indexOf(workerTwo), false)
          })

          it('should log warnings', function () {
            assert.strictEqual(console.warn.called, true)
          })

          it('should not listen for the invalid workers \'message\' event', function () {
            assert.strictEqual(workerOne.on.called, false)
            assert.strictEqual(workerTwo.on.called, false)
          })
        })
      })
    })
  })

  describe('Scenario: Forgetting workers', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
      })

      describe('with a number of acknowledged workers', function () {
        let workerOne = null
        let workerTwo = null
        let workerThree = null

        beforeEach(function () {
          workerOne = utils.mockChildProcess()
          workerTwo = utils.mockChildProcess()
          workerThree = utils.mockChildProcess()

          master.ack(workerOne, workerTwo, workerThree)
        })

        describe('when forgetting mulitple workers', function () {
          beforeEach(function () {
            master.forget(workerOne, workerThree)
          })

          it('should remove the forgotten workers processes from the list of acknowledged workers', function () {
            assert.deepStrictEqual(master.__workers, [workerTwo])
          })
        })
      })
    })
  })

  describe('Scenario: Emitting an event from the Master IPC-Emitter', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null
      let listener = null

      beforeEach(function () {
        ;({master} = ipce)
        listener = sinon.stub()
        master.on('click', listener)
      })

      describe('which knows about multiple worker processes', function () {
        let workerOne = null
        let workerTwo = null

        beforeEach(function () {
          workerOne = utils.mockChildProcess()
          workerTwo = utils.mockChildProcess()

          sinon.stub(workerOne, 'send')
          sinon.stub(workerTwo, 'send')

          master.ack(workerOne, workerTwo)
        })

        afterEach(function () {
          workerOne.send.restore()
          workerTwo.send.restore()
        })

        describe('when emitting an event from the Master IPC-Emitter', function () {
          beforeEach(function () {
            master.emit('click', 1, 2)
          })

          it('should trigger the masters listeners for that event', function () {
            assert.strictEqual(listener.calledOnce, true)
            assert.deepStrictEqual(listener.getCall(0).args, [1, 2])
          })

          it('should send a payload to each of the workers', function () {
            const expectedPayload = {
              event: 'click',
              args: [1, 2]
            }

            ;[workerOne, workerTwo].forEach((worker) => {
              const payload = JSON.parse(worker.send.getCall(0).args[0])
              assert.deepStrictEqual(payload, expectedPayload)
            })
          })
        })
      })
    })
  })

  describe('Scenario: Retreiving invalid payloads from worker processes', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
      })

      describe('which knows about multiple worker processes', function () {
        let workerOne = null
        let workerTwo = null

        beforeEach(function () {
          workerOne = utils.mockChildProcess(0)
          workerTwo = utils.mockChildProcess(1)

          sinon.stub(workerOne, 'send')
          sinon.stub(workerTwo, 'send')

          master.ack(workerOne)
          master.ack(workerTwo)
        })

        describe('when a worker process sends an invalid payload', function () {
          it('should not try to trigger the masters listeners', function () {
            sinon.spy(events.prototype, 'emit')
            workerOne.mockSend('{"invalid": "payload"}')
            assert.strictEqual(events.prototype.emit.callCount, 1)
            events.prototype.emit.restore()
          })

          it('should not send the payload to the workers', function () {
            workerOne.mockSend('{"invalid": "payload"}')
            assert.strictEqual(workerOne.send.called, false)
            assert.strictEqual(workerTwo.send.called, false)
          })
        })
      })
    })
  })

  describe('Scenario: Retreiving valid payloads from worker processes', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null
      let listener = null

      beforeEach(function () {
        ;({master} = ipce)
        listener = sinon.stub()
        master.on('click', listener)
      })

      describe('which knows about multiple worker processes', function () {
        let workerOne = null
        let workerTwo = null

        beforeEach(function () {
          workerOne = utils.mockChildProcess(0)
          workerTwo = utils.mockChildProcess(1)

          sinon.stub(workerOne, 'send')
          sinon.stub(workerTwo, 'send')

          master.ack(workerOne)
          master.ack(workerTwo)
        })

        describe('when a worker process sends a valid payload', function () {
          let payload = null

          beforeEach(function () {
            payload = {
              pid: workerOne.pid,
              event: 'click',
              args: [1, 2]
            }

            workerOne.mockSend(JSON.stringify(payload))
          })

          it('should trigger the masters listeners for the event emitted', function () {
            assert.strictEqual(listener.calledOnce, true)
            assert.deepStrictEqual(listener.getCall(0).args, payload.args)
          })

          it('should send the payload to the workers who did not create the event', function () {
            assert.strictEqual(workerTwo.send.calledOnce, true)
            assert.strictEqual(workerTwo.send.getCall(0).args[0], JSON.stringify(payload))
          })

          it('should not send the payload to worker who created the event', function () {
            assert.strictEqual(workerOne.send.called, false)
          })
        })
      })
    })
  })
})
