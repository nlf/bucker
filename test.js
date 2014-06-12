var bucker = require('./index');
var logger = bucker.createLogger({ console: true, influxdb: {} }, module);

logger.log('hello', { test: 'data' }, 14);
logger.module('bacon').log('hi again');
logger.error('ruh roh').email();
logger.stat('something', 42);
