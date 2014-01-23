var path = require('path');
var util = require('util');
var moment = require('moment');
var nodemailer = require("nodemailer");
var url = require('url');

var Console = require('./lib/console');
var File = require('./lib/file');
var Syslog = require('./lib/syslog');
var Logstash = require('./lib/logstash');
var UDP = require('./lib/udp');

var types = ['console', 'file', 'syslog', 'logstash', 'udp'];
var levels = {
    debug: { num: 0, color: 'blue' },
    info: { num: 1, color: 'green' },
    warn: { num: 2, color: 'yellow' },
    error: { num: 3, color: 'red' },
    exception: { num: 4, color: 'red' },
    stat: { num: 5, color: 'blue' },
    reverse: ['debug', 'info', 'warn', 'error', 'exception', 'stat']
};

var Bucker = function (opts, mod) {
    var self = this;
    var file, host;

    self.options = {};
    self.files = {};
    self.syslog = {};
    self.logstash = {};
    self.udp = {};
    self.console = {};
    self.handlers = { access: {}, debug: {}, info: {}, warn: {}, error: {}, exception: {}, stat: {} };
    self.loggers = [];
    self.name = '';
    self._tags = [];
    self._lastLog = {};

    if (typeof opts === 'undefined') opts = {};
    else self.options = opts;

    self.handleExceptions = opts.hasOwnProperty('handleExceptions') ? opts.handleExceptions : false;

    if (opts.hasOwnProperty('level')) {
        if (typeof opts.level === 'string') {
            if (levels.hasOwnProperty(opts.level)) self.level = levels[opts.level].num;
        } else if (typeof opts.level === 'number') {
            if (opts.level <= 3 && opts.level >= 0) self.level = opts.level;
        }
    }
    if (!self.hasOwnProperty('level')) self.level = 0;

    if (opts.hasOwnProperty('name') || (mod && mod.filename)) self.name = opts.name || path.basename(mod.filename, '.js');

    if (opts.hasOwnProperty('app')) {
        self._setDefaultHandler(opts.app, 'file');
    } else {
        self._setDefaultHandler({ file: false }, 'file');
    }

    if (opts.hasOwnProperty('console')) {
        self._setDefaultHandler(opts.console, 'console');
    } else {
        self._setDefaultHandler({ console: true }, 'console');
    }

    if (opts.hasOwnProperty('syslog')) {
        self._setDefaultHandler(opts.syslog, 'syslog');
    } else {
        self._setDefaultHandler({ syslog: false }, 'syslog');
    }

    if (opts.hasOwnProperty('logstash')) {
        self._setDefaultHandler(opts.logstash, 'logstash');
    } else {
        self._setDefaultHandler({ logstash: false }, 'logstash');
    }

    if (opts.hasOwnProperty('udp')) {
        self._setDefaultHandler(opts.udp, 'udp');
    } else {
        self._setDefaultHandler({ udp: false }, 'udp');
    }

    if (opts.hasOwnProperty('access')) self._setHandler(opts.access, 'access');
    if (opts.hasOwnProperty('debug')) self._setHandler(opts.debug, 'debug');
    if (opts.hasOwnProperty('info')) self._setHandler(opts.info, 'info');
    if (opts.hasOwnProperty('warn')) self._setHandler(opts.warn, 'warn');
    if (opts.hasOwnProperty('stat')) self._setHandler(opts.stat, 'stat');
    if (opts.hasOwnProperty('error')) {
        self._setHandler(opts.error, 'error');
        self._setHandler(opts.error, 'exception');
    }

    if (self.handleExceptions) {
        process.on('uncaughtException', function (err) {
            self.exception(err);
            process.exit(1);
        });
    }
};

Bucker.prototype._setDefaultHandler = function (options, type) {
    var self = this;
    var loglevels = levels.reverse.concat(['access']);
    var opts = {};

    opts[type] = options.hasOwnProperty(type) ? options[type] : options;
    loglevels.forEach(function (level) {
        self._setHandler(opts, level);
    });
};

Bucker.prototype._setHandler = function (options, level) {
    var self = this;
    var hash;

    if (options === false) self.handlers[level] = false;

    if (typeof options === 'string') {
        hash = path.resolve(options);
        if (!self.files.hasOwnProperty(hash)) self.files[hash] = self.loggers.push(File(options, self.name)) - 1;
        self.handlers[level].file = self.files[hash];
    } else {
        if (options.hasOwnProperty('file')) {
            if (options.file === false) {
                self.handlers[level].file = false;
            } else {
                hash = path.resolve(typeof options.file === 'string' ? options.file : JSON.stringify(options.file));
                if (!self.files.hasOwnProperty(hash)) self.files[hash] = self.loggers.push(File(options.file, options.file.name || self.name)) - 1;
                self.handlers[level].file = self.files[hash];
            }
        }
        if (options.hasOwnProperty('console')) {
            if (options.console === false) {
                self.handlers[level].console = false;
            } else {
                hash = typeof options.console === 'boolean' ? options.console.toString() : JSON.stringify(options.console);
                if (!self.console.hasOwnProperty(hash)) self.console[hash] = self.loggers.push(Console(options.console, options.console.name || self.name)) - 1;
                self.handlers[level].console = self.console[hash];
            }
        }
        if (options.hasOwnProperty('syslog')) {
            if (options.syslog === false) {
                self.handlers[level].syslog = false;
            } else {
                hash = typeof options.syslog === 'string' ? options.syslog : JSON.stringify(options.syslog);
                if (!self.syslog.hasOwnProperty(hash)) self.syslog[hash] = self.loggers.push(Syslog(options.syslog, options.syslog.name || self.name)) - 1;
                self.handlers[level].syslog = self.syslog[hash];
            }
        }
        if (options.hasOwnProperty('logstash')) {
            if (options.logstash === false) {
                self.handlers[level].logstash = false;
            } else {
                hash = typeof options.logstash === 'string' ? options.logstash : JSON.stringify(options.logstash);
                if (!self.logstash.hasOwnProperty(hash)) self.logstash[hash] = self.loggers.push(Logstash(options.logstash, options.logstash.name || self.name)) - 1;
                self.handlers[level].logstash = self.logstash[hash];
            }
        }
        if (options.hasOwnProperty('udp')) {
            if (options.udp === false) {
                self.handlers[level].udp = false;
            } else {
                hash = typeof options.udp === 'string' ? options.udp : JSON.stringify(options.udp);
                if (!self.udp.hasOwnProperty(hash)) self.udp[hash] = self.loggers.push(UDP(options.udp, options.udp.name || self.name)) - 1;
                self.handlers[level].udp = self.udp[hash];
            }
        }
    }
};

Bucker.prototype._findHandler = function (level, type) {
    return this.loggers[this.handlers[level][type]];
};

Bucker.prototype._runHandlers = function (level, data) {
    var self = this;
    var handler;
    self._setLastLog(moment(), level, self.name, data, self._tags);

    if (levels[level].num < self.level) return;
    types.forEach(function (type) {
        handler = self._findHandler(level, type);
        if (handler) handler.log(moment(), level, self.name, data, self._tags);
    });
};

Bucker.prototype._setLastLog = function (time, level, name, data, _tags) {
    this._lastLog = {time: time.format('YYYY-MM-DD HH:mm'), level: level, name: name, data: data, _tags: _tags};
};

function _clone(source, target) {
    for (var key in source) {
        target[key] = source[key];
    }
}

Bucker.prototype.module = function (mod) {
    var newBucker = {};

    _clone(this, newBucker);
    newBucker.name = mod;

    return newBucker;
};

Bucker.prototype.tags = function (tags) {
    var newBucker = {};

    _clone(this, newBucker);
    newBucker._tags = tags;

    return newBucker;
};

Bucker.prototype.exception = function (err) {
    var self = this;
    var handler;

    types.forEach(function (type) {
        handler = self._findHandler('exception', type);
        if (handler) handler.exception(moment(), self.name, err, self._tags);
    });
};

Bucker.prototype.debug = function () {
    this._runHandlers('debug', util.format.apply(this, arguments));
    return this;
};

Bucker.prototype.log = Bucker.prototype.info = function () {
    this._runHandlers('info', util.format.apply(this, arguments));
    return this;
};

Bucker.prototype.warn = function () {
    this._runHandlers('warn', util.format.apply(this, arguments));
    return this;
};

Bucker.prototype.warning = function () {
    this._runHandlers('warn', util.format.apply(this, arguments));
    return this;
};

Bucker.prototype.error = function () {
    this._runHandlers('error', util.format.apply(this, arguments));
    return this;
};

Bucker.prototype.stat = function (name, type, value) {
    type = type || 'counter';
    var self = this;
    var handler;

    types.forEach(function (type) {
        handler = self._findHandler('stat', type);
        if (handler) handler.stat(moment(), self.name, name, type, value, self._tags);
    });
};

Bucker.prototype.access = function (data) {
    var self = this;
    var handler;

    data.time = moment(data.time);
    types.forEach(function (type) {
        handler = self._findHandler('access', type);
        if (handler) handler.access(self.name, data, self._tags);
    });
};

Bucker.prototype.middleware = function () {
    var self = this;

    return function (req, res, next) {
        var end = res.end;
        var access = {
            remote_ip: req.ip || req.socket.remoteAddress || req.socket.socket.remoteAddress,
            time: new Date(),
            method: req.method,
            url: req.originalUrl || req.url,
            http_ver: req.httpVersion,
            referer: req.headers.referer || req.headers.referrer || '-',
            agent: req.headers['user-agent'],
            length: 0,
            status: 0,
            response_time: Date.now()
        };

        res.end = function (chunk, encoding) {
            access.response_time = String(Date.now() - access.response_time) + "ms";
            res.end = end;
            res.end(chunk, encoding);
            access.length = res._headers['content-length'] || 0;
            access.status = res.statusCode;
            self.access(access);
        };
        next();
    };
};

Bucker.prototype.errorHandler = function (opts) {
    var self = this;

    return function (err, req, res, next) {
        self.exception(err);
        return next(err);
    };
};

Bucker.prototype.email = function () {
    var self = this;

    if (!self.options.hasOwnProperty('email')) {
        self.error('no email configuration specified');
        return 'no email service!';
    }

    // check time difference between last send email
    if (self._lastEmail && moment().diff(moment(self._lastEmail), 'minutes') < 5)
        return; // ignoring it to protect the email recipient!

    // create transport method (opens pool of SMTP connections)
    var transport = nodemailer.createTransport('SMTP', {
        host: self.options.email.smtp,
        secureConnection: true,
        port: 465,
        auth: {
            user: self.options.email.username,
            pass: self.options.email.password
        }
    });

    var mailOptions = {
        from: self.options.email.adress,
        to: self.options.email.address,
        subject: '[BUCKER-LOG] ' + self._lastLog.level + ': ' + self._lastLog.time,
        text: '[BUCKER-LOG] ' + self._lastLog.time + ' ' + self._lastLog.level + ': ' + self._lastLog.data + (self._lastLog._tags.length > 0 ? '\n\tTags: ' + self._lastLog._tags.join(', ') : '')
    };

    // send mail with defined transport object
    transport.sendMail(mailOptions, function (error, response) {
        if (error) {
            self.error(error);
        } else {
            self.log('Message sent:' + response.message);
        }

        // shut down the connection pool, no more messages
        transport.close();
    });

    self._lastEmail = moment();
    return self;
};

// Hapi plugin
exports.register = function (plugin, options, next) {
    // get/make bucker object
    var bucker;

    var hapiLog = function (event, tags) {
        var data;
        var level = 'info'; //Default
        // this is done intentionally so if multiple levels
        // are declared, the one with highest priority will be used
        if (tags.debug) level = 'debug';
        if (tags.info) level = 'info';
        if (tags.warn) level = 'warn';
        if (tags.error) level = 'error';
        event.tags = event.tags.filter(function (tag) {
            return !~['error', 'warn', 'info', 'debug'].indexOf(tag);
        });
        data = util.format(event.data);
        bucker.tags(event.tags)[level](data);
    };

    if (options instanceof Bucker) {
        bucker = options;
        options = bucker.options;
    } else {
        bucker = new Bucker(options);
    }

    // access logger
    plugin.events.on('request', function (request, event, tags) {
        var level;
        //First check for hapi response events
        if (tags.hapi && tags.response) {
            var access = {
                remote_ip: request.info.remoteAddress,
                time: new Date(event.timestamp),
                method: request.method.toUpperCase(),
                url: request.url.path,
                agent: request.headers['user-agent'],
                referer: request.headers.referer || request.headers.referrer || '-',
                http_ver: request.raw.req.httpVersion,
                length: request.response.headers['content-length'],
                status: request.response.statusCode,
                response_time: new Date().getTime() - request.info.received + 'ms'
            };
            return bucker.access(access);
        }
        //If we have an explicitly defined tag that is a loglevel, log it.
        if ((!options.hapi || (options.hapi && options.hapi.handleLog)) && (tags.debug || tags.info || tags.warn || tags.error)) {
            hapiLog(event, tags);
        }
    });
    // add listener by default but dont if its false
    if (!options.hapi || (options.hapi && options.hapi.handleLog)) {
        plugin.events.on('log', function (event, tags, timestamp) {
            hapiLog(event, tags);
        });

        plugin.events.on('internalError', function (event, error) {
            bucker.exception({ message: error.message, stack: error.stack });
        });
    }
    // and attach ourselves to server.plugins.bucker
    plugin.expose(bucker);
    return next();
};

exports.createLogger = function (options, mod) {
    return new Bucker(options, mod);
};

exports.createNullLogger = function (options, mod) {
    var nullLogger = {};
    var chainingNoop = function () { return nullLogger; };

    Object.keys(Bucker.prototype).forEach(function (method) {
        if (method[0] === '_') return;

        nullLogger[method] = chainingNoop;
    });
    return nullLogger;
};
