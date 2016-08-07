'use strict'

const events = require('events')

module.exports = {
  /**
   * mockChildProcess returns a valid mock worker process.
   * @param  {Number} pid The process id of the worker.
   * @return {Object}     Object mocking a valid worker process.
   */
  mockChildProcess (pid = 0) {
    const workerProcessMock = Object.create(events.prototype)

    workerProcessMock.pid = pid
    workerProcessMock.send = function () {}
    workerProcessMock.mockSend = function mockSend (payload) {
      this.emit('message', payload)
    }

    return workerProcessMock
  }
}
