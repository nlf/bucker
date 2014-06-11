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
    options.level = Utils.validateLevel(options.level);

    // initial state
    this.events = new EventEmitter();
    this.transports = [];
    this.name = options.name || Utils.getNameFromParent(parent);
    this.emailOptions = options.email;

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

    // load requested transports
    for (i = 0, l = requestedTransports.length; i < l; i++) {
        var key = requestedTransports[i];
        var transports = [].concat(options[key]);
        for (il = 0, ll = transports.length; il < ll; il++) {
            var opts = transports[il] || {};
            opts.level = opts.hasOwnProperty('level') ? Utils.validateLevel(opts.level) : options.level;
            this.transports.push(new require(availableTransports[key])(this.events, Utils.levels, opts));
        }
    }
};

// closure to generate functions for log levels
var generateLevel = function (level) {

    return function () {

        // only emit if we have a listener, otherwise just do nothing
        if (this.events.listeners(level).length) {
            this.events.emit(level, this.name, Moment(), arguments);
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
    newBucker.tags = tags;

    return newBucker;
};

// send this log message via email
Bucker.prototype.email = function (options) {

    var opts = options || this.emailOptions;
    if (!opts) {
        this.warn('Tried to use email() without configuring');
        return this;
    }
    if (!Nodemailer) {
        this.warn('Tried to use email() but nodemailer is not installed');
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
