var bucker = require('./index');
var assert = require('assert');


// Null Logger Test --------------------------------------

var nullLogger = bucker.createNullLogger();

var logMethods = ['log', 'access', 'debug', 'info', 'warn', 'warning', 'error', 'exception', 'email'];

logMethods.forEach(function (logMethod) {
    assert.doesNotThrow(function () {
        nullLogger[logMethod]('Try to log');
    }, 'Calling ' + logMethod + ' should do nothing');
});

assert.doesNotThrow(function () {
    nullLogger.log('foo').debug('bar').exception('hi');
}, 'Can chain things');

assert.doesNotThrow(function () {
    nullLogger.tags(['foo', 'bar']).info('Log something');
}, 'Can still try and make tags');

assert.doesNotThrow(function () {
    nullLogger.module('new_module_name').info('Log something');
}, 'Can still try and submodule a nullLogger');

console.log('nullLogger tests pass');



// Logger test ------------------------------------------

var Console = require('./lib/console');
var logged = [];
Console.prototype.log = function (time, level, module, data, tags) {
    logged.push({
        time: time,
        level: level,
        module: module,
        data: data,
        tags: tags
    });
};

var logger = bucker.createLogger({ console: true });

// Basic logging
logged = [];
logger.log('foo');
assert.equal(logged[0].data, 'foo', '[noModule] Logs string');
assert.equal(logged[0].module, '', '[noModule] No module');


// Module logging
logged = [];
logger.module('MyModule').log('foo');
assert.equal(logged[0].data, 'foo', '[WithModule] Logs string');
assert.equal(logged[0].module, 'MyModule', '[WithModule] Has module name');


// Chained logging
logged = [];
logger.module('MyModule').log('foo').warn('bar').debug('baz');
assert.equal(logged[0].data, 'foo', '[Chained] Logs first string');
assert.equal(logged[0].level, 'info', '[Chained] Logs first string as "log"');

assert.equal(logged[1].data, 'bar', '[Chained] Logs second string');
assert.equal(logged[1].level, 'warn', '[Chained] Logs second string as "warn"');

assert.equal(logged[2].data, 'baz', '[Chained] Logs last string');
assert.equal(logged[2].level, 'debug', '[Chained] Logs last string as "debug"');

console.log('Logger tests pass');
