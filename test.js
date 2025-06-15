const test = require('node:test');
const nanobus = require('./');

globalThis.DEBUG = true;

test('nanobus', async t => {
  await t.test('should assert input types', t => {
    t.plan(11);
    const bus = nanobus();
    t.assert.throws(bus.emit.bind(bus), /string/);
    t.assert.throws(bus.on.bind(bus), /string/);
    t.assert.throws(bus.on.bind(bus, 'foo'), /function/);
    t.assert.throws(bus.once.bind(bus), /string/);
    t.assert.throws(bus.once.bind(bus, 'foo'), /function/);
    t.assert.throws(bus.removeListener.bind(bus), /string/);
    t.assert.throws(bus.removeListener.bind(bus, 'foo'), /function/);

    const s = Symbol('event');
    const fn = function () {};
    t.assert.doesNotThrow(bus.emit.bind(bus, s));
    t.assert.doesNotThrow(bus.on.bind(bus, s, fn));
    t.assert.doesNotThrow(bus.once.bind(bus, s, fn));
    t.assert.doesNotThrow(bus.removeListener.bind(bus, s, fn));
  });

  await t.test('should emit messages', t => {
    t.plan(4);
    const bus = nanobus();
    const obj = { bin: 'baz' };
    bus.on('foo:bar', function (data) {
      t.assert.equal(data, obj, 'data was same');
    });

    bus.emit('foo:bar', obj);

    bus.on('beep:boop', function (data) {
      t.assert.equal(data, undefined);
    });

    bus.emit('beep:boop');

    bus.on('baz:floop', function (arg1, arg2) {
      t.assert.equal(arg1, 'arg1', 'data was same');
      t.assert.equal(arg2, 'arg2', 'data was same');
    });

    bus.emit('baz:floop', 'arg1', 'arg2');
  });

  await t.test('should prepend listeners', t => {
    t.plan(4);
    let i = 0;
    const bus = nanobus();
    bus.on('foo:bar', function (_data) {
      t.assert.equal(i, 1);
    });

    bus.prependListener('foo:bar', function (_data) {
      t.assert.equal(i, 0);
      i++;
    });

    bus.emit('foo:bar');

    bus.on('*', function (_data) {
      t.assert.equal(i, 1);
    });

    bus.prependListener('*', function (_eventName, data) {
      t.assert.equal(i, data);
      i++;
    });

    i = 0;
    bus.emit('bar:baz', i);
  });

  await t.test('should prepend once listeners', t => {
    t.plan(3);
    let i = 0;
    const bus = nanobus();
    bus.on('foo:bar', function (_data) {
      t.assert.equal(i, 1);
    });

    bus.prependOnceListener('foo:bar', function (_data) {
      t.assert.equal(i, 0);
      i++;
    });

    bus.emit('foo:bar');
    bus.emit('foo:bar');
  });

  await t.test('should emit messages once', t => {
    t.plan(1);
    const bus = nanobus();
    bus.once('foo:bar', function (_data) {
      t.assert.ok('called');
    });

    bus.emit('foo:bar');
    bus.emit('foo:bar');
  });

  await t.test('should properly emit messages when using both once() and on() ', t => {
    t.plan(2);
    const bus = nanobus();
    let i = 0;

    bus.once('foo:bar', function onceIncrement() {
      i++;
    });

    bus.on('foo:bar', function onIncrement() {
      i++;
    });

    bus.once('*', function wildcardOnceIncrement() {
      i++;
    });

    bus.on('*', function wildcardOnIncrement() {
      i++;
    });

    bus.emit('foo:bar');
    t.assert.equal(i, 4, 'incremented by once() and on()');

    bus.emit('foo:bar');
    t.assert.equal(i, 6, 'incremented by on() only');
  });

  await t.test('should trigger wildcard once', t => {
    t.plan(3);
    const bus = nanobus();
    bus.once('*', function (_data) {
      t.assert.ok('called');
    });

    bus.on('foo:bar', function (_data) {
      t.assert.ok('called foo:bar');
    });

    bus.on('foo:baz', function (_data) {
      t.assert.ok('called foo:baz');
    });

    bus.emit('foo:bar');
    bus.emit('foo:baz');
  });

  await t.test('should be able to remove listeners', t => {
    t.plan(3);
    const bus = nanobus();
    bus.on('foo:bar', goodHandler);
    bus.on('foo:bar', badHandler);
    bus.removeListener('foo:bar', badHandler);
    bus.emit('foo:bar');

    bus.once('foo:bar', goodHandler);
    bus.removeListener('foo:bar', onceHandler);
    bus.emit('foo:bar');

    function goodHandler(_data) {
      t.assert.ok('called');
    }

    function onceHandler(_data) {
      t.assert.ok('called');
    }

    function badHandler(_data) {
      t.fail('oh no!');
    }
  });

  await t.test('should be able to remove all listeners', t => {
    t.plan(1);
    const bus = nanobus();
    let i = 0;

    bus.on('foo:bar', handler);
    bus.on('bin:baz', handler);
    bus.removeAllListeners();
    bus.emit('foo:bar');
    bus.emit('bin:baz');

    t.assert.equal(i, 0, 'no events called');

    function handler(_data) {
      i++;
    }
  });

  await t.test('should be able to remove all listeners for an event', t => {
    t.plan(1);
    const bus = nanobus();
    let i = 0;

    bus.on('foo:bar', handler);
    bus.on('bin:baz', handler);
    bus.removeAllListeners('bin:baz');
    bus.emit('foo:bar');
    bus.emit('bin:baz');

    t.assert.equal(i, 1, '1 event called');

    function handler(_data) {
      i++;
    }
  });

  await t.test('should be able to have * listeners', t => {
    t.plan(12);
    const bus = nanobus();
    let i = 0;

    bus.on('foo:bar', handler);
    bus.on('bin:baz', handler);
    bus.on('*', handler);

    bus.emit('foo:bar');
    t.assert.equal(i, 2, 'count 2');

    bus.emit('bin:baz');
    t.assert.equal(i, 4, 'count 4');

    bus.removeAllListeners('bin:baz');
    bus.emit('bin:baz');
    t.assert.equal(i, 5, 'count 5');

    bus.removeListener('*', handler);
    bus.emit('foo:bar');
    t.assert.equal(i, 6, 'count 6');

    bus.on('*', handler);
    bus.emit('foo:bar');
    t.assert.equal(i, 8, 'count 8');

    bus.removeAllListeners('*');
    bus.emit('foo:bar');
    t.assert.equal(i, 9, 'count 9');

    bus.on('*', handler);
    bus.emit('foo:bar');
    t.assert.equal(i, 11, 'count 11');

    bus.removeAllListeners();
    t.assert.equal(i, 11, 'count 11');

    bus.once('*', handler);
    bus.emit('foo:bar');
    t.assert.equal(i, 12, 'count 12');
    bus.emit('foo:bar');
    t.assert.equal(i, 12, 'count 12');

    bus.removeAllListeners();
    t.assert.equal(i, 12, 'count 12');

    bus.on('*', starHandler);
    bus.emit('star:event', i);
    bus.removeAllListeners();

    function handler(_data) {
      i++;
    }

    function starHandler(_eventName, data) {
      t.assert.equal(data, i, 'data was same');
    }
  });

  await t.test('should be able to remove listeners that have not been attached', t => {
    const bus = nanobus();

    t.assert.doesNotThrow(function () {
      bus.removeListener('yay', handler);
    }, 'removes unattched "yay" event');
    t.assert.doesNotThrow(function () {
      bus.removeListener('*', handler);
    }, 'removes unattached "*" event');

    function handler() {}
  });

  await t.test('should be able to get an array of listeners', t => {
    t.plan(2);
    const bus = nanobus();

    bus.on('foo', bar);
    bus.on('foo', baz);

    t.assert.deepEqual(bus.listeners('foo'), [bar, baz]);

    bus.on('*', bar);
    bus.on('*', baz);

    t.assert.deepEqual(bus.listeners('foo'), [bar, baz]);

    function bar(_data) {}
    function baz(_data) {}
  });

  await t.test('should be able to trigger multiple listeners with same args', t => {
    t.plan(6);
    const obj = { foo: 'bar' };
    const bus = nanobus();

    bus.on('foo', function (data) {
      t.assert.deepEqual(data, obj);
    });

    bus.on('foo', function (data) {
      t.assert.deepEqual(data, obj);
    });

    bus.on('foo', function (data) {
      t.assert.deepEqual(data, obj);
    });

    bus.on('*', function (_name, data) {
      t.assert.deepEqual(data, obj);
    });

    bus.on('*', function (_name, data) {
      t.assert.deepEqual(data, obj);
    });

    bus.on('*', function (_name, data) {
      t.assert.deepEqual(data, obj);
    });

    bus.emit('foo', obj);
  });
});
