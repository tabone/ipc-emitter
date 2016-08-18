'use strict'

;['master', 'worker', 'utils', 'types/error'].forEach((file) => {
  require(`./${file}`)
})
