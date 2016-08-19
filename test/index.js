'use strict'

;['master', 'worker', 'utils', 'marshaller', 'types/error'].forEach((file) => {
  require(`./${file}`)
})
