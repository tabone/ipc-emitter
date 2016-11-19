'use strict'
const events = require('events')
const utils = require('./utils')
const marshaller = require('./marshaller')
const master = Object.create(events.prototype)

// Prefixed fields used by IPC-Emitter.
const fields = {
  pid: utils.prefix('pid'),
  args: utils.prefix('args'),
  event: utils.prefix('event')
}

/**
 * echo configures the master instance to echo any events retrieved by its
 * workers to its own master.
 */
master.echo = function echo () {
  if (!utils.isValidWorker(process)) {
    console.warn('master is not a worker')
    return
  }

  this.__echoEvents = true
}

/**
 * stopEcho configures the master instance to stop echoing the events retrieved
 * by its workers to its own master.
 */
master.stopEcho = function stopEcho () {
  delete this.__echoEvents
}

/**
 * ack acknowledge the existance of a child process. By doing so the master
 * will:
 *   1. Listen for events it emits so that it can inform others.
 *   2. Notify it about events emitted by other processes or by the master
 *      itself.
 * @param  {...[process]} workers The process object of the child process.
 * @return {master}               The master instance.
 */
master.ack = function ack (...workers) {
  // If the array which the master instance will be storing the child processes
  // is not initated yet, create it.
  if (this.__workers === undefined) this.__workers = []

  // Store listener to be used in the workers 'message' event. This is done so
  // that when a worker is forgotten, the listener can be referenced and removed
  // without affecting other listeners registered.
  if (this.__handlePayloadListener === undefined) {
    this.__handlePayloadListener = handlePayload.bind(this)
  }

  // Traverse the workers provided and include the valid child processes in the
  // workers list.
  workers.forEach((worker, index) => {
    if (!utils.isValidWorker(worker)) {
      console.warn(`worker at index ${index} is missing the 'send()' function`)
      return
    }

    // Listen for messages from the worker to be acknowledged.
    worker.on('message', this.__handlePayloadListener)

    // Include worker in the list of acknowledged workers.
    this.__workers.push(worker)
  })

  return this
}

/**
 * forget removes the specified workers from being acknowledged (and therefore
 * notified) by the master.
 * @param  {...[process]} workers The process object of the child process.
 * @return {master}               The master instance.
 */
master.forget = function forget (...workers) {
  // If there are no acknowledged workers, do nothing.
  if (this.__workers === undefined) return

  // Traverse the specified workers and remove them from the acknowledged list.
  workers.forEach((worker) => {
    // Remove the listeners created by the master IPC.
    worker.removeListener('message', this.__handlePayloadListener)
    // Remove from acknowledged workers.
    this.__workers.splice(this.__workers.indexOf(worker), 1)
  })

  return this
}

/**
 * emit sends a payload to the worker processes to be received and handled by
 * the worker ipc-emitters. The payload consist of:
 *   1. The name of the emitted event name.
 *   2. List of arguments to be used in the listeners subscribed to the
 *      emitted event.
 * @param  {String}       ev The name of the emitted event.
 * @param  {...[Mixed]} args Arguments to be provided to the listeners of the
 *                           emitted event.
 * @return {master}          The master instance.
 */
master.emit = function emit (ev, ...args) {
  // Notify instance listeners.
  events.prototype.emit.call(this, ev, ...args)

  // Notify all workers
  sendPayload.call(this, {
    [ fields.event ]: ev,
    [ fields.args ]: args
  })

  return this
}

/**
 * sendPayload sends a payload to all the acknowledged workers. Note that if the
 * payload originated from a worker (payload would have the 'pid' field), the
 * payload isn't sent to the worker it originated from.
 * @param  {Number}       payload.IPCE_pid   The process id of the worker which
 *                                           the payload originated from. Note
 *                                           that if the payload is sent from
 *                                           the master, this field will not be
 *                                           present.
 * @param  {String}       payload.IPCE_event The name of the emitted event.
 * @param  {Array{Mixed}} payload.IPCE_args  Arguments to be provided to the
 *                                           listeners of the emitted event.
 */
function sendPayload (payload) {
  // Marshal args.
  payload[fields.args] = marshaller.marshal(payload[fields.args])

  // Go through each worker and send them the payload.
  this.__workers.forEach((worker) => {
    const pidKey = fields.pid
    // If payload originates from a worker being traversed, don't echo the
    // payload back to it.
    if (payload[pidKey] !== undefined && payload[pidKey] === worker.pid) return
    worker.send(payload)
  })
}

/**
 * handlePayload handles the payload received by a worker. If payload is valid
 * it is echoed back to all workers except the worker that it was received from
 * @param  {String} payload Payload received from a worker.
 */
function handlePayload (payload) {
  // Parse and validate received payload.
  if ((payload = utils.parsePayload(payload)) === null) return

  // Unmarshal args.
  payload[fields.args] = marshaller.unmarshal(payload[fields.args])

  // Notify instance listeners.
  events.prototype.emit.call(this, payload[fields.event],
    ...payload[fields.args])

  // Notify all workers except the worker who emitted the event.
  sendPayload.call(this, payload)

  // If the master is configured to echo events to its own master, the event
  // emitted by the worker should be echoed to the master.
  if (this.__echoEvents === true) process.send(payload)
}

module.exports = master
