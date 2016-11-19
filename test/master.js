'use strict'
/* eslint-env mocha */

const events = require('events')
const assert = require('assert')
const sinon = require('sinon')
const utils = require('../src/utils')
const testUtils = require('./libs/utils')
const ipce = require('../index')

describe('Master Module', function () {
  const fields = {
    pid: utils.prefix('pid'),
    event: utils.prefix('event'),
    args: utils.prefix('args')
  }

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
          workerOne = testUtils.mockChildProcess()
          workerTwo = testUtils.mockChildProcess()

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
      let listener = null

      beforeEach(function () {
        ;({master} = ipce)
        listener = sinon.stub()
        master.on('click', listener)
      })

      describe('with a number of acknowledged workers', function () {
        let workerOne = null
        let workerTwo = null
        let workerThree = null

        beforeEach(function () {
          workerOne = testUtils.mockChildProcess(1)
          workerTwo = testUtils.mockChildProcess(2)
          workerThree = testUtils.mockChildProcess(3)

          master.ack(workerOne, workerTwo, workerThree)
        })

        describe('when forgetting mulitple workers', function () {
          beforeEach(function () {
            master.forget(workerOne, workerThree)
          })

          it('should remove the forgotten workers processes from the list of acknowledged workers', function () {
            assert.deepStrictEqual(master.__workers, [workerTwo])
          })

          it('should stop listening for any events that the forgotten workers might emit', function () {
            const payload = {
              [ fields.pid ]: workerOne.pid,
              [ fields.event ]: 'click'
            }

            workerOne.mockSend(payload)
            workerThree.mockSend(payload)
            assert.strictEqual(listener.called, false)
          })
        })
      })

      describe('with an acknowledged worker which has its own listeners registered to the \'message\' event', function () {
        let workerOne = null
        let listener = null

        beforeEach(function () {
          workerOne = testUtils.mockChildProcess(1)
          listener = sinon.stub()
          workerOne.on('message', listener)

          master.ack(workerOne)
        })

        describe('when forgetting the worker', function () {
          beforeEach(function () {
            master.forget(workerOne)
          })

          it('should not affect the listeners which were not registered by the master ipc-emitter', function () {
            workerOne.emit('message')
            assert.strictEqual(listener.called, true)
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
          workerOne = testUtils.mockChildProcess()
          workerTwo = testUtils.mockChildProcess()

          sinon.stub(workerOne, 'send')
          sinon.stub(workerTwo, 'send')

          master.ack(workerOne, workerTwo)
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
              [ fields.event ]: 'click',
              [ fields.args ]: [1, 2]
            }

            ;[workerOne, workerTwo].forEach((worker) => {
              const payload = worker.send.getCall(0).args[0]
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
          workerOne = testUtils.mockChildProcess(0)
          workerTwo = testUtils.mockChildProcess(1)

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

          it('should not send the payload to the other workers', function () {
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
          workerOne = testUtils.mockChildProcess(0)
          workerTwo = testUtils.mockChildProcess(1)

          sinon.stub(workerOne, 'send')
          sinon.stub(workerTwo, 'send')

          master.ack(workerOne)
          master.ack(workerTwo)
        })

        describe('when a worker process sends a valid payload', function () {
          let payload = null

          beforeEach(function () {
            payload = {
              [ fields.pid ]: workerOne.pid,
              [ fields.event ]: 'click',
              [ fields.args ]: [1, 2]
            }

            workerOne.mockSend(payload)
          })

          it('should trigger the masters listeners for the event emitted', function () {
            assert.strictEqual(listener.calledOnce, true)
            assert.deepStrictEqual(listener.getCall(0).args, payload[fields.args])
          })

          it('should send the payload to the workers who did not create the event', function () {
            assert.strictEqual(workerTwo.send.calledOnce, true)
            assert.deepStrictEqual(workerTwo.send.getCall(0).args[0], payload)
          })

          it('should not send the payload to worker who created the event', function () {
            assert.strictEqual(workerOne.send.called, false)
          })
        })
      })
    })
  })

  describe('Scenario: Configuring a master to echo events when it is not a worker', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        sinon.stub(console, 'warn')
        ;({master} = ipce)
      })

      afterEach(function () {
        console.warn.restore()
      })

      describe('when configured to echo events', function () {
        beforeEach(function () {
          master.echo()
        })

        it('should warn the user', function () {
          assert.strictEqual(console.warn.calledOnce, true)
        })
      })
    })
  })

  describe('Scenario: Configuring a master to echo events when it is a worker', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
        process.send = function () {}
        sinon.stub(console, 'warn')
      })

      afterEach(function () {
        delete process.send
        console.warn.restore()
      })

      describe('when configured to echo events', function () {
        beforeEach(function () {
          master.echo()
        })

        it('should not warn the user', function () {
          assert.strictEqual(console.warn.calledOnce, false)
        })

        it('should configure the master object to echo events', function () {
          assert.strictEqual(master.__echoEvents, true)
        })
      })
    })
  })

  describe('Scenario: Configuring a master to stop echoing events', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
        process.send = function () {}
      })

      afterEach(function () {
        delete process.send
      })

      describe('which is configured to echo events', function () {
        beforeEach(function () {
          master.echo()
        })

        describe('when it is configured to stop echoing events', function () {
          beforeEach(function () {
            master.stopEcho()
          })

          it('should configure the master object to echo events', function () {
            assert.strictEqual(master.__echoEvents, undefined)
          })
        })
      })
    })
  })

  describe('Scenario: Retrieving a payload with a master configured to echo events to its own master', function () {
    describe('Given a Master IPC-Emitter', function () {
      let master = null

      beforeEach(function () {
        ;({master} = ipce)
        process.send = sinon.spy()
      })

      afterEach(function () {
        delete process.send
      })

      describe('which is configured to echo events', function () {
        beforeEach(function () {
          master.echo()
        })

        describe('and knows about a worker', function () {
          let workerOne = null

          beforeEach(function () {
            workerOne = testUtils.mockChildProcess(0)
            sinon.stub(workerOne, 'send')
            master.ack(workerOne)
          })

          describe('when a worker process sends a valid payload', function () {
            let payload = null

            beforeEach(function () {
              payload = {
                [ fields.pid ]: workerOne.pid,
                [ fields.event ]: 'click',
                [ fields.args ]: [1, 2]
              }

              workerOne.mockSend(payload)
            })

            it('should echo the payload to its own master', function () {
              assert.strictEqual(process.send.callCount, 1)
              assert.strictEqual(process.send.getCall(0).args[0], payload)
            })
          })
        })
      })
    })
  })
})
