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

In addition to the connect middleware, bucker also exports a middleware for Hapi. To use it, require bucker as a plugin, for example..

```javascript
var Hapi = require('hapi');
var pack = new Hapi.Pack();

pack.server('localhost', 8000, { labels: ['our server'] });
pack.allow({ ext: true }).require('bucker', options, function () {});
```

Also included is a generic error handling middleware for connect. It logs the error appropriately as an exception, then continues to the next step in the middleware chain

```javascript
app.use(logger.errorHandler());
```


Options
=======

* app - filename to save application log items to.
* error - filename to save error log items to. if this is not specified, errors will be combined with the regular app log if one is available.
* access - filename to save access log items to.
* console - boolean specifying if we should print to console or not.
* syslog - a host:port combination to send logs to via syslog (e.g. 'localhost:6500'). port defaults to 514 if not specified. this may also be specified as an object, as in { host: 'localhost', port: 514 }
* level - minimum level to log, this can be specified as a string (i.e. 'error') or as a number (i.e. 3). items that are below this level will not be logged.
* name - name to use when namespacing logs. note that this will override the module reference if one is passed.
* handleExceptions - a boolean to indicate whether or not we should add an uncaughtException handler. the handler will log the event as an exception, then process.exit(1).
* hapi - when using bucker for logging as a hapi plugin we add a handler to the server's 'log' event and log the data with an appropriate log level based on the tags provided. You can prevent this behavior by adding the property 'handleLog', set as false to the hapi object ``` hapi: { handleLog: false } ```

The above list describes the most basic usage of each option. Below, I've written out an example config object that shows all available options.
In addition to the 'app' option, individual configurations may be set for each log level supporting the same options as the 'app' and 'error' items. If no level options are specified, the defaults (those passed to the 'app' and/or 'error' options) will be used.

```javascript
{ file: {
    filename: '/path/to/file',
    format: ':level :time :data',
    timestamp: 'HH:mm:ss',
    accessFormat: ':time :level :method :status :url'
  },
  console: {
    color: false
  },
  syslog: {
    host: 'localhost',
    port: 514,
    facility: 18
  }
}
```

Note that the format and timestamp options are not available to the syslog facility, though they are available to file and console. the accessFormat option is available for every transport. Timestamp may be set to false to prevent timestamps from being printed. Obviously, the filename option is exclusive to the file transport. Additionally, the color option is exclusive to the console transport and the facility, host, and port options to the syslog transport.

If you have questions, feature requests, or comments, please create an issue and I'll respond to them as soon as I'm able.
