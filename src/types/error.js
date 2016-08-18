'use strict'

module.exports = {
  /**
   * marshallable determines whether the argument can be marshalled using this
   * object.
   * @param  {Mixed} arg  Any value.
   * @return {Boolean}    True if arg is an Error Object, false otherwise.
   */
  marshallable (arg) {
    return arg instanceof Error
  },

  /**
   * marshal marshalles an Error instance.
   * @param  {Error} arg  The error instance to be marshalled
   * @return {Object}     Marshalled version of the Error instance provided.
   */
  marshal (arg) {
    return {
      // Will be used to create the new instance.
      constructor: arg.constructor.name,
      // Custom name given by the user.
      name: arg.name,
      // Stack trace.
      stack: arg.stack,
      // Custom message given by the user.
      message: arg.message
    }
  },

  /**
   * unmarshal unmarshalls an object to a new Error instace.
   * @param  {Object} arg Object to be marshalled to a new Error instance.
   * @return {Error}      Error instance version of the marshalled object
   *                            provided.
   */
  unmarshal (arg) {
    // List of valid Error Types.
    // Docs: https://nodejs.org/api/errors.html
    const validErrors = ['EvalError', 'SyntaxError', 'RangeError', 'TypeError',
      'ReferenceError', 'URIError', 'Error']

    // If constructor name is not a valid Error Constructor, return the arg
    // itself.
    if (!~validErrors.indexOf(arg.constructor)) return arg

    // Create a new Error instance of the same type and message.
    var newError = new global[arg.constructor](arg.message)

    // Set custom name.
    newError.name = arg.name

    // Set custom stack.
    newError.stack = arg.stack

    return newError
  }
}
