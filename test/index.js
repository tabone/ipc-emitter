'use strict'

;['master', 'worker', 'utils'].forEach((file) => {
  require(`./${file}`)
})
