[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# nanobus

Fork of [nanobus]. Tiny message bus.

## Usage
```js
import nanobus from 'nanobus';

const bus = nanobus();

bus.on('foo', function (color) {
  console.log('color is', color);
});

bus.emit('foo', 'blue');
```

## FAQ
### Why not use the Node API?
We had the requirement for a `*` event to catch all calls, and figured we could
improve the file size at the same time. This library is about 1/3rd the size of
Node's version. And it was easy to build, so yeah good enough of an excuse hah.

### How do I listen for replies?
You can do this by using the `.once()` listener and establishing a convention
around naming schemas.

```js
bus.on('foo', function (color) {
  console.log('foo called')
  bus.emit('foo:res')
})

bus.once('foo:res', function () {
  console.log('response received')
})
bus.emit('foo')
```

### When shouldn't I use this package?
If you're only writing code that runs inside Node and don't need a `'*'`
listener, consider using the built-in event emitter API instead.

### Are the emitters asynchronous?
No. If you're interested in doing that, use something like
[nanotick](https://github.com/yoshuawuyts/nanotick) to batch events and ensure
they run asynchronously.

## API
### `bus = nanobus([name])`
Create a new `nanobus` instance. Optionally takes a name that will be used for
tracing in the browser using the `performance.mark` / `performance.measure`
API.

### `bus.emit(eventName, [data])`
Emit an event. Arbitrary data can optionally be passed as an argument. `'*'`
listeners run after named listeners.

### `bus.on(eventName, listener([data]))`
### `bus.addListener(eventName, listener([data]))`
Listen to an event. If the event name is `'*'` the listener signature is
`listener(eventName, [data], [performanceTimingId])`.

### `bus.prependListener(eventName, listener([data]))`
Listen to an event, but make sure it's pushed to the start of the listener
queue. If the event name is `'*'` the listener signature is
`listener(eventName, [data])`.

### `bus.once(eventName, listener([data]))`
Listen to an event, and clear it after it's been called once.  If the event
name is `'*'` the listener signature is
`listener(eventName, [data], [performanceTimingId])`.

### `bus.prependOnceListener(eventName, listener([data]))`
Listen to an event, and clear it after it's been called once.  If the event
name is `'*'` the listener signature is `listener(eventName, [data])`.

### `bus.removeListener(eventName, listener)`
Remove a specific listener to an event.

### `listeners = bus.listeners(eventName)`
Return all listeners for a given event. `'*'` listeners are not included in
this list. Use `bus.listeners('*')` to get a list of `'*'` listeners.

### `bus.removeAllListeners([eventName])`
Remove all listeners to an event. If no event name is passed, removes all
listeners on the message bus. `'*'` listeners are not removed unless
`eventName` is `*` or no event name is passed.

## TypeScript

Optional event typing is available in TypeScript by passing an object type with 
event names as keys and event listener function signatures as values.

```ts
// if compilerOptions.esModuleInterop = true
import Nanobus from "nanobus"
// else
import Nanobus = require("nanobus") 

type Events = {
    foo: (color: string) => void
    bar: (count: number) => void
}

const bus = new Nanobus<Events>()

bus.on("foo", color => {
    // color: string
    console.log("color is", color)
})

bus.on("bar", count => {
    // count: number
    console.log("count is", count)
})

bus.on("*", (eventName, data) => {
    // eventName: "foo" | "bar"
    // data: any[]
    if (eventName === "foo") {
        const [color] = data as Parameters<Events["foo"]>
        // color: string
    } else if (eventName === "bar") {
        const [count] = data as Parameters<Events["bar"]>
        // count: number
    }
})

bus.emit("foo", "blue")  // required arguments: [string]
bus.emit("bar", 100)  // required arguments: [number]
```

## License
[MIT](https://tldrlegal.com/license/mit-license)


[nanobus]: https://npmjs.org/package/nanobus

[npm-image]: https://img.shields.io/npm/v/@pirxpilot/nanobus
[npm-url]: https://npmjs.org/package/@pirxpilot/nanobus

[build-url]: https://github.com/pirxpilot/nanobus/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/pirxpilot/nanobus/check.yaml?branch=main

[deps-image]: https://img.shields.io/librariesio/release/npm/@pirxpilot/nanobus
[deps-url]: https://libraries.io/npm/@pirxpilot%2Fnanobus
