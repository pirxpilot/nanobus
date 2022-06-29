const splice = require('remove-array-items')
const nanotiming = require('@pirxpilot/nanotiming')
const assert = require('assert')

module.exports = nanobus

function nanobus (name = 'nanobus') {
  let _starListeners = []
  let _listeners = Object.create(null)

  const self = {
    emit,
    addListener,
    on: addListener,
    once,
    prependListener,
    prependOnceListener,
    removeListener,
    off: removeListener,
    removeAllListeners,
    listeners
  }

  return self

  function emit (eventName, ...data) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.emit: eventName should be type string or symbol')

    const emitTiming = nanotiming(`${name}('${eventName.toString()}')`)
    const listeners = _listeners[eventName]
    if (listeners && listeners.length > 0) {
      _emit(_listeners[eventName], ...data)
    }

    if (_starListeners.length > 0) {
      _emit(_starListeners, eventName, ...data, emitTiming.uuid)
    }
    emitTiming()

    return self
  }

  function addListener (eventName, listener) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.on: eventName should be type string or symbol')
    assert(typeof listener === 'function', 'nanobus.on: listener should be type function')

    if (eventName === '*') {
      _starListeners.push(listener)
    } else {
      if (!_listeners[eventName]) _listeners[eventName] = []
      _listeners[eventName].push(listener)
    }
    return self
  }

  function prependListener (eventName, listener) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.prependListener: eventName should be type string or symbol')
    assert(typeof listener === 'function', 'nanobus.prependListener: listener should be type function')

    if (eventName === '*') {
      _starListeners.unshift(listener)
    } else {
      if (!_listeners[eventName]) _listeners[eventName] = []
      _listeners[eventName].unshift(listener)
    }
    return self
  }

  function once (eventName, listener) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.once: eventName should be type string or symbol')
    assert(typeof listener === 'function', 'nanobus.once: listener should be type function')

    return addListener(eventName, once)

    function once (...args) {
      listener.apply(self, args)
      removeListener(eventName, once)
    }
  }

  function prependOnceListener (eventName, listener) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.prependOnceListener: eventName should be type string or symbol')
    assert(typeof listener === 'function', 'nanobus.prependOnceListener: listener should be type function')

    return prependListener(eventName, once)

    function once (...args) {
      listener.apply(self, args)
      removeListener(eventName, once)
    }
  }

  function removeListener (eventName, listener) {
    assert(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.removeListener: eventName should be type string or symbol')
    assert(typeof listener === 'function', 'nanobus.removeListener: listener should be type function')

    if (eventName === '*') {
      _starListeners = _starListeners.slice()
      return remove(_starListeners, listener)
    } else {
      if (typeof _listeners[eventName] !== 'undefined') {
        _listeners[eventName] = _listeners[eventName].slice()
      }

      return remove(_listeners[eventName], listener)
    }

    function remove (arr, listener) {
      if (!arr) return
      const index = arr.indexOf(listener)
      if (index !== -1) {
        splice(arr, index, 1)
        return true
      }
    }
  }

  function removeAllListeners (eventName) {
    if (eventName) {
      if (eventName === '*') {
        _starListeners = []
      } else {
        _listeners[eventName] = []
      }
    } else {
      _starListeners = []
      _listeners = Object.create(null)
    }
    return self
  }

  function listeners (eventName) {
    const listeners = eventName !== '*' ? _listeners[eventName] : _starListeners
    return listeners ? [...listeners] : []
  }
}

function _emit (arr, ...data) {
  if (typeof arr === 'undefined') return
  if (arr.length === 0) return
  for (const listener of arr) {
    listener.apply(listener, data)
  }
}
