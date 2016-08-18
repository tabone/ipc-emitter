'use strict'

const utils = require('./utils')
const errorType = require('./types/error')

// Prefixed fields used by IPC-Emitter.
const fields = {
  type: utils.prefix('type'),
  data: utils.prefix('data')
}

module.exports = {
  /**
   * List of types which IPC-Emitter supports.
   * @type {Object}
   */
  types: {
    error: errorType
  },

  /**
   * unmarshal goes through each provided arg and checks whether it can
   * unmarshal it. This is done by looking for the prefixed 'type' (determines
   * the type of the argument) and the prefixed 'data' (determines the data
   * which will be used to unmarshal the arg).
   * @param  {Array[Mixed]} args Data to be checked.
   * @return {Array[Mixed]} Unmarshalled data.
   */
  unmarshal (args) {
    return args.map((arg) => {
      // If argument is not an object, return the arg itself.
      if (typeof arg !== 'object') return arg

      // If argument doesn't have prefixed 'type' and 'data', the arg wasn't
      // created by IPC-Emitter and therefore should return the arg itself.
      if (!(fields.type in arg) || !(fields.data in arg)) return arg

      // Retrieve type based on prefixed 'type' value.
      const type = this.types[arg[fields.type]]

      // If type of the argument isn't handled by IPC-Emitter, the arg wasn't
      // created by IPC-Emitter and therefore should return the arg itself.
      if (type === undefined) return arg

      // Return unmarshal version of the data recieved.
      return type.unmarshal(arg[fields.data])
    })
  },

  /**
   * marshal goes through each provided arg and checks whether it can marshal
   * it. This is done by going passing each arg in the 'marshallable' function
   * of each supported type. If this function returns true, the arg is
   * marshalled.
   * @param  {Array[Mixed]} args Data to be checked.
   * @return {Array[Mixed]} Marshalled data.
   */
  marshal (args) {
    return args.map((arg) => {
      for (var key in this.types) {
        if (!!this.types[key].marshallable(arg) === false) continue

        return {
          [ fields.type ]: key,
          [ fields.data ]: this.types[key].marshal(arg)
        }
      }

      return arg
    })
  }
}
