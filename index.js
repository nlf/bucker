var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    colors = require('colors'),
    levels = {
        'debug': { num: 0, color: 'blue' },
        'info': { num: 1, color: 'green' },
        'warn': { num: 2, color: 'yellow' },
        'error': { num: 3, color: 'red' }
    };

function openStream(file) {
    var dir = path.dirname(file);
    mkdirp.sync(dir);
    return fs.createWriteStream(file, { encoding: 'utf8', flags: 'a+' });
}

var Bucker = module.exports = function (opts) {
    if (!(this instanceof Bucker)) return new Bucker(opts);
    this.options = opts || {};
    if (this.options.access) this.accessFile = openStream(this.options.access);
    if (this.options.error) this.errorFile = openStream(this.options.error);
    if (this.options.app) this.appFile = openStream(this.options.app);
    if (this.options.level) {
        if (~Object.getOwnPropertyNames(levels).indexOf(this.options.level)) {
            this.options.level = levels[this.options.level].num;
        }
    }
    this.options.console = typeof opts.console === 'boolean' ? opts.console : true;
};

Bucker.prototype._writeLog = function (level, line) {
    if (this.options.level > levels[level].num) return;
    var now = new Date(),
        fileItem,
        consoleItem,
        consoleTime,
        fileOutput = level === 'error' ? this.errorFile : this.appFile,
        consoleOutput = level === 'error' ? console.error : console.log;

    if (fileOutput) {
        fileItem = util.format('%s %s: %s\n', now.toISOString(), level, line);
        fileOutput.write(fileItem);
    }
    if (this.options.console) {
        consoleTime = now.toTimeString();
        consoleTime = consoleTime.slice(0, consoleTime.indexOf(' '));
        consoleItem = util.format('%s %s: %s', consoleTime, level[levels[level].color], line);
        consoleOutput(consoleItem);
    }
};

Bucker.prototype.log = Bucker.prototype.info = function () {
    this._writeLog('info', util.format.apply(this, arguments));
};

Bucker.prototype.debug = function () {
    this._writeLog('debug', util.format.apply(this, arguments));
};

Bucker.prototype.warn = function () {
    this._writeLog('warn', util.format.apply(this, arguments));
};

Bucker.prototype.error = function () {
    this._writeLog('error', util.format.apply(this, arguments));
};

Bucker.prototype.access = function (access) {
    var fileAccess = util.format('%s - - [%s] "%s %s HTTP/%s" %d %s "%s" "%s"\n', access.remote_ip, access.time.toUTCString(), access.method, access.url, access.http_ver, access.status, access.length, access.referer, access.agent),
        consoleAccess,
        consoleTime = access.time.toTimeString();
    
    consoleTime = consoleTime.slice(0, consoleTime.indexOf(' '));
    consoleAccess = consoleTime + ' access: '.grey + access.method + ' ' + access.url + ' ' + access.status;
    if (this.accessFile) this.accessFile.write(fileAccess);
    if (this.options.console) console.log(consoleAccess);
};

Bucker.prototype.middleware = function () {
    var self = this;
    return function (req, res, next) {
        var end, access = {};
        if (self.options.access) {
            access.remote_ip = req.ip || req.socket.socket.remoteAddress;
            access.time = new Date();
            access.method = req.method;
            access.url = req.originalUrl || req.url;
            access.http_ver = req.httpVersion;
            access.referer = req.headers.referer || req.headers.referrer || '-';
            access.agent = req.headers['user-agent'];
            end = res.end;
            res.end = function (chunk, encoding) {
                res.end = end;
                res.end(chunk, encoding);
                access.length = res.get('content-length') || 0;
                access.status = res.statusCode;
                self.access(access);
            };
        }
        next();
    };
};
