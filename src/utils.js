'use strict'

module.exports = {
  /**
   * prefix a word with a unique phrase to identify ipc-emitter specific fields.
   * @param  {String} msg The string to be prefixed.
   * @return {String}     Prefixed string.
   */
  prefix (msg) {
    return `IPCE_${msg}`
  },

  /**
   * parsePayload parses and validates the provided payload. When a payload is
   * invalid this method returns null else it returns a object representation of
   * the payload. A payload is considered invalid if:
   *   1. It is not an object.
   *   2. It doesn't have an 'event' field.
   * In addition to this if a payload does not have an Array 'args' field it
   * creates one and defaults it to an empty array.
   * @param  {Number}       payload.IPCE_pid   The process id of the worker
   *                                           which the payload originated
   *                                           from. Note that if the payload is
   *                                           sent from the master, this field
   *                                           will not be present.
   * @param  {String}       payload.IPCE_event The name of the emitted event.
   * @param  {Array{Mixed}} payload.IPCE_args  Arguments to be provided to the
   *                                           listeners of the emitted event.
   * @return {Object}       An object representation of the payload or null.
   */
  parsePayload (payload) {
    // Prefixed event & args fields.
    const eventKey = this.prefix('event')
    const argsKey = this.prefix('args')

    // If payload isn't an object and/or doesn't have prefixed 'event' field, it
    // is considered invalid.
    if (typeof payload !== 'object' || payload[eventKey] === undefined) {
      return null
    }

    // If prefixed 'args' field is not an array, default it to an empty array.
    if (payload[argsKey] === undefined || payload[argsKey].constructor !== Array) {
      payload[argsKey] = []
    }

    // At this point payload is valid, return it.
    return payload
  },

  /**
   * isValidWorker checks whether a process is a valid worker process. Checks
   * are made using duck-typing techniques by checking whether the process
   * object has the 'send()' and 'on()' functions and a 'pid' numeric field.
   * Additional info about the 'send()' function in process objects:
   * https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback
   * @param  {Process}  worker Process object of a child process.
   * @return {Boolean}         TRUE if process is connected to an IPC Channel,
   *                           FALSE otherwise.
   */
  isValidWorker (worker) {
    return worker !== undefined && typeof worker.send === 'function' &&
      typeof worker.on === 'function' && typeof worker.pid === 'number'
  }
}
