'use strict'

module.exports = {
  get master () {
    return Object.create(require('./src/master'))
  },

  get worker () {
    return require('./src/worker')
  }
}
