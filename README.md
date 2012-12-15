What is it
==========

Bucker is a simple logging module that has everything you need to make your logs sane, readable, and useful.


Usage
=====

```javascript
var logger = require('bucker').createLogger(opts, module);

logger.info('informational message');
logger.debug('debug message');
logger.warn('warning');
logger.error('error');
logger.log('also works for informational messsages');
```

Where opts is an optional object containing your configuration options, and the module reference is optionally used for namespacing your logs and can be omitted.

Log levels available are, debug, info, warn, and error. When specifying a level in your initial options, items will only be logged if they are equal to or above the level chosen. For example, if options contains a level of 'info', debug messages will be ignored while info, warn, and error level messages will be logged.

Messages are passed through [util.format](http://nodejs.org/api/util.html#util_util_format_format) so can be more than simple strings, and work very similar to console.log.

Included in the logger is a middleware for connect/express that writes access logs, to use it simply add it to your middleware stack

```javascript
app.use(logger.middleware());
```


Options
=======

* app - filename to save application log items to.
* error - filename to save error log items to. if this is not specified, errors will be combined with the regular app log if one is available.
* access - filename to save access log items to. note that access logs are written in the Apache common log format.
* console - boolean specifying if we should print to console or not.
* level - minimum level to log, this can be specified as a string (i.e. 'error') or as a number (i.e. 3). items that are below this level will not be logged.
* name - name to use when namespacing logs. note that this will override the module reference if one is passed.
