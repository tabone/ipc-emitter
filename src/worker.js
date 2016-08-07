'use strict'
const events = require('events')
const utils = require('./utils')
const worker = Object.create(events.prototype)

// This module should only be used within node programs which are connected to
// an IPC Channel. When this is not the case, a warning is issued.
if (!utils.isValidWorker(process)) {
  console.warn('worker should only be used in child processes')
}

// The master will be notifying the worker of any events through the 'message'
// event. When triggered, checks are made to determine whether the payload
// recieved is indeed from the master ipc-emitter and if it is invoke the
// appropriate listeners. If it's not, nothing should happen.
process.on('message', (payload) => {
  // Validate and parse payload
  if ((payload = utils.parsePayload(payload)) === null) return

  // Notify instance listeners.
  events.prototype.emit.call(worker, payload.event, ...payload.args)
})

/**
 * emit sends a payload to the master process to be received and handled by the
 * master ipc-emitter. The payload consist of:
 *   1. The worker's process id.
 *   2. The name of the emitted event name.
 *   3. List of arguments to be used in the listeners subscribed to the
 *      emitted event.
 * @param  {String}       ev The name of the emitted event.
 * @param  {...[Mixed]} args Arguments to be provided to the listeners of the
 *                           emitted event.
 * @return {worker}          The worker instance.
 */
worker.emit = function emit (ev, ...args) {
  // Notify instance listeners.
  events.prototype.emit.call(this, ev, ...args)

  // Construct the payload.
  const payload = {
    event: ev,
    args: args,
    pid: process.pid
  }

  // Send payload to master process to be retrieved and handled by the master
  // ipc-emitter.
  process.send(JSON.stringify(payload))

  return this
}

module.exports = worker
