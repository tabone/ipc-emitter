'use strict'

module.exports = {
  /**
   * parsePayload parses and validates the provided payload. When a payload is
   * invalid this method returns null else it returns a object representation of
   * the payload. A payload is considered invalid if:
   *   1. It is not a valid JSON.
   *   2. It doesn't have an 'event' field.
   * In addition to this if a payload does not have an Array 'args' field it
   * creates one and defaults it to an empty array.
   * @param  {Number}       payload.pid   The process id of the worker which the
   *                                      payload originated from. Note that if
   *                                      the payload is sent from the master,
   *                                      this field will not be present.
   * @param  {String}       payload.event The name of the emitted event.
   * @param  {Array{Mixed}} payload.args  Arguments to be provided to the
   *                                      listeners of the emitted event.
   * @return {Object}       An object representation of the payload or null.
   */
  parsePayload (payload) {
    // Try to parse the payload as JSON.
    try {
      payload = JSON.parse(payload)
    } catch (e) {
      // If payload is not a valid JSON, return null.
      return null
    }

    // If payload doesn't have 'event' field, it is considered invalid.
    if (payload.event === undefined) return null

    // If 'args' field is not an array, default it to an empty array.
    if (payload.args === undefined || payload.args.constructor !== Array) {
      payload.args = []
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
