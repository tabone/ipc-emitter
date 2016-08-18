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
   * List of types which IPC-Emitter handle.
   * @type {Object}
   */
  types: {
    error: errorType
  },

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
