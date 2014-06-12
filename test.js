var bucker = require('./index');
var logger = bucker.createLogger({ level: 17, console: { level: 1, color: false }, influxdb: {} }, module);

logger.log('hello', { test: 'data' }, 14);
logger.module('bacon').log('hi again');
logger.error('ruh roh').email();
logger.stat('something', 42);
