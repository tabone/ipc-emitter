# ipc-emitter
## Installation

    npm install --save ipc-emitter

## Master

```javascript
const {master} = require('ipc-emitter')
```

Master is an [EventEmitter](), with a few difference.

When it emits an event (using the [.emit()]() function) apart from triggering its own listeners, it also notifies other acknowledged processes through the IPC Channel (using [process.send()]() method).

In addition to this, it also listens for events triggered by the acknowledged processes (by listening for their `message` event) so that it its own listeners and also notifies other acknowledged processes (note that the process which triggered the event is not notified).

> Getting a Master IPC-Emitter it will always return a new object.

### .ack( [process]() [, [process]()[...] ] )
Acknowledges a process. Doing so the Master:

1. Will be listening for any events the newly acknowleged process might emit so that it can notify other acknowledged processes.
2. Will notify the newly acknowledged process of any events other acknowledged processes might emitted.


### .forget( [process]() [, [process]()[...] ] )
Removes a process from the list of acknowledged processes. Doing so the master:

1. Will stop listening for any events the newly forgotten process might emit.
2. Will stop notifing the newly forgotten process of any events other acknowledged processes might emit.

## Worker

```javascript
const {worker} = require('ipc-emitter')
```

Worker is an [EventEmitter](), with a few difference.

When it emits an event (using the [.emit()]() function) apart from triggering its own listeners, it also notifies its master process through the IPC Channel (using [process.send()]() method). Doing this if the Master Process is using the Master IPC-Emitter, the event will be notified in all of its acknowledged workers.

> Getting a Worker IPC-Emitter will always return the same object

## Example
### boot.js

``` javascript
'use strict'

const {fork} = require('child_process')
const {master} = require('ipc-emitter')

master.on('new-user', (userId) => {
  console.info(`boot: new user: ${userId}`)
})

master.ack(fork('./auth'), fork('./log'))
```

### log.js

```javascript
'use strict'

const {worker} = require('ipc-emitter')

console.info('Logger initiated')

worker.on('new-user', (userId) => {
  console.info(`log: new user: ${userId}`)
})
```

### auth.js

```javascript
'use strict'

const {worker} = require('ipc-emitter')

console.info('Auth initiated')

setTimeout(() => {
  worker.emit('new-user', 1)
}, 2000)
```

### Output
```
Logger initiated
Auth initiated
boot: new user: 1
log: new user: 1
```