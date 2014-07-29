var EventEmitter = require('events').EventEmitter;
var Path = require('path');
var Fs = require('fs');
var Moment = require('moment');
var Utils = require('./lib/utils');
var Nodemailer;

try {
    Nodemailer = require('nodemailer');
} catch (e) { }

var Bucker = function (options, parent) {

    // if we only got one argument, see if it's options or a parent
    if (arguments.length === 1 && options.exports) {
        parent = options;
        options = {};
    }

    options = options || {};

    // initial state
    this.events = new EventEmitter();
    this.transports = [];
    this.name = options.name || Utils.getNameFromParent(parent);
    this.emailOptions = options.email;
    this._tags = [];

    var i, l, il, ll;
    // register available transports
    var availableTransports = {};
    var files = Fs.readdirSync(Path.join(__dirname, 'transports'));
    for (i = 0, l = files.length; i < l; i++) {
        var name = Path.basename(files[i], '.js');
        availableTransports[name] = Path.join(__dirname, 'transports', files[i]);
    }

    // see what transports they've configured
    var requestedTransports = Object.keys(options).filter(function (key) {
        return ['email', 'level', 'name'].indexOf(key) === -1 &&
            Object.keys(availableTransports).indexOf(key) !== -1;
    });

    // add the console transport if no others were specified
    if (requestedTransports.length === 0) {
        requestedTransports.push('console');
    }

    var loadTransport = function (transport) {

        this.transports.push(new transport(this.events, opts));
    }.bind(this);

    // load requested transports
    for (i = 0, l = requestedTransports.length; i < l; i++) {

        var key = requestedTransports[i];
        var transports = [].concat(options[key]);
        for (il = 0, ll = transports.length; il < ll; il++) {

            var opts = transports[il];
            if (opts === false) {
                continue;
            }

            opts = opts === true ? {} : opts || {};
            opts.level = opts.hasOwnProperty('level') ? Utils.validateLevel(opts.level) : Utils.validateLevel(options.level);
            loadTransport(opts.transport || require(availableTransports[key]));
        }
    }
};

// closure to generate functions for log levels
var generateLevel = function (level) {

    return function () {

        // only emit if we have a listener, otherwise just do nothing
        if (this.events.listeners(level).length) {
            this.events.emit(level, this.name, Moment(), this._tags, Array.prototype.slice.call(arguments));
        }

        return this;
    };
};

// create the log level methods
for (var i = 0, l = Utils.levels.length; i < l; i++) {

    Bucker.prototype[Utils.levels[i]] = generateLevel(Utils.levels[i]);
}

// aliases
Bucker.prototype.log = Bucker.prototype.info;
Bucker.prototype.warning = Bucker.prototype.warn;

// clone with new name
Bucker.prototype.module = function (mod) {

    var newBucker = Utils.clone(this);
    newBucker.name = Utils.getNameFromParent(mod);

    return newBucker;
};

// clone with new tags
Bucker.prototype.tags = function (tags) {
    
    var newBucker = Utils.clone(this);
    newBucker._tags = tags;

    return newBucker;
};

// send this log message via email
Bucker.prototype.email = function (options) {

    var opts = options || this.emailOptions;
    if (!opts) {
        this.module('bucker').warn('Tried to use email() without configuring');
        return this;
    }

    if (!Nodemailer) {
        this.module('bucker').warn('Tried to use email() but nodemailer is not installed');
        return this;
    }

};

// create an instance of Bucker
exports.createLogger = function (options, parent) {

    return new Bucker(options, parent);
};

// create a logger that does nothing
exports.createNullLogger = function () {

    return new Bucker({ console: false });
};

// hapi plugin
exports.register = function (plugin, options, next) {

    var bucker;
    if (options instanceof Bucker) {
        bucker = options;
        options = bucker.options;
    }
    else {
        bucker = exports.createLogger(options);
    }

    var log = function (event, tags) {

        var level = 'info'; // default level

        if (tags.debug) {
            level = 'debug';
        }

        if (tags.info) {
            level = 'info';
        }

        if (tags.warn || tags.warning) {
            level = 'warn';
        }

        if (tags.error) {
            level = 'error';
        }

        if (tags.exception) {
            level = 'exception';
        }

        var eventTags = event.tags.filter(function (tag) { return Utils.levels.indexOf(tag) === -1; });
        if (tags.hapi && tags.error && ((event.data && event.data.msec) || tags.unauthenticated)) {
            return; // ignore weird internal hapi errors
        }

        if (tags.hapi && (tags.handler || tags.received)) {
            return;
        }

        return bucker.tags(eventTags)[level](event.data);
    };

    plugin.events.on('request', function (request, event, tags) {

        if (tags.hapi && tags.response) { // access log event

            return bucker.access({
                remote_ip: request.info.remoteAddress,
                time: Moment(event.timestamp),
                method: request.method.toUpperCase(),
                url: request.url.path,
                agent: request.headers['user-agent'],
                referer: request.headers.referer || request.headers.referrer || '-',
                http_ver: request.raw.req.httpVersion,
                length: request.response.headers['content-length'],
                status: request.response.statusCode,
                response_time: +Moment() - request.info.received + 'ms'
            });
        }

        return log(event, tags);
    });

    plugin.events.on('log', function (event, tags) {

        return log(event, tags);
    });

    plugin.events.on('internalError', function (event, error) {

        return bucker.exception({ message: error.message, stack: error.stack });
    });

    plugin.expose(bucker);

    return next();
};
exports.register.attributes = { pkg: require('./package.json') };
