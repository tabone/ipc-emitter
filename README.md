[![Build Status](https://travis-ci.org/tabone/ipc-emitter.svg?branch=master)](https://travis-ci.org/tabone/ipc-emitter)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![npm version](https://badge.fury.io/js/ipc-emitter.svg)](https://badge.fury.io/js/ipc-emitter)

# ipc-emitter
## Installation

    npm install --save ipc-emitter

## Master

```javascript
const {master} = require('ipc-emitter')
```

Master is an [EventEmitter](https://nodejs.org/api/events.html), with a few differences.

When it emits an event (using the [.emit()](https://nodejs.org/api/events.html#events_emitter_emit_eventname_arg1_arg2) function) apart from triggering its own listeners, it also notifies other acknowledged processes through the IPC Channel (using [process.send()](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) method).

In addition to this, it also listens for events emitted by acknowledged processes (by listening for their `message` event) so that triggers its own listeners and also notifies other acknowledged processes to trigger their own (note that the process which triggered the event is not notified).

> When getting a Master IPC-Emitter will always return a new object.

### API
#### .ack( [process](https://nodejs.org/api/process.html) [, [process](https://nodejs.org/api/process.html)[...] ] )
Acknowledges a process. Doing so the Master:

1. Will be listening for any events the newly acknowleged process might emit so that it can trigger its own listeners and notify other acknowledged processes.
2. Will notify the newly acknowledged process of any events emitted either the master or other acknowledged processes.

#### .forget( [process](https://nodejs.org/api/process.html) [, [process](https://nodejs.org/api/process.html)[...] ] )
Removes a process from the list of acknowledged processes. Doing so the Master:

1. Will stop listening for any events the newly forgotten process might emit.
2. Will stop notifing the newly forgotten process of any events emitted either by the master or other acknowledged processes.

#### .echo()
Configures the Master to echo events retrieved by its workers, to its own Master. 

> When a Master is configured to echo events, if it is not a Worker the user is warned.

#### .stopEcho()
Configures the Master to stop echoing events retrieved by its workers, to its own Master. 

## Worker

```javascript
const {worker} = require('ipc-emitter')
```

Worker is an [EventEmitter](https://nodejs.org/api/events.html), with a few differences.

When it emits an event (using the [.emit()](https://nodejs.org/api/events.html#events_emitter_emit_eventname_arg1_arg2) function) apart from triggering its own listeners, it also notifies its master process through the IPC Channel (using [process.send()](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) method). Doing this if the Master Process is using the Master IPC-Emitter, the event will be echoed to all of the acknowledged workers.

> When getting a Worker IPC-Emitter will always return the same object.

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
