var Util = require('util');
var Chalk = require('chalk');
var BaseTransport = require('../lib/baseTransport');

var colors = {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    exception: 'red',
    access: 'gray',
    stat: 'gray'
};

var Console = BaseTransport.extend(function () {
    if (!this.options.hasOwnProperty('timestamp') || this.options.timestamp === true) {
        this.options.timestamp = 'HH:mm:ss';
    }

    if (!this.options.format) {
        this.options.format = ':time :level:tags: :data';
    }

    if (!this.options.accessFormat) {
        this.options.accessFormat = ':time :level:tags: :method :url :status :response_time';
    }
});

Console.prototype._format = function (level, name, timestamp, tags, data) {

    var color = colors[level];
    var line = this.options.format;
    line = line.replace(':time', this.options.timestamp ? timestamp.format(this.options.timestamp) : '');
    line = line.replace(':level', Chalk[color](name ? name + '.' + level : level));
    line = line.replace(':tags', tags.length ? Chalk.gray('[' + tags.join(',') + ']') : '');
    line = line.replace(':data', Util.format.apply(null, data));

    return this.options.color === false ? Chalk.stripColor(line) : line;
};

Console.prototype.debug = function (name, timestamp, tags, data) {

    return console.log(this._format('debug', name, timestamp, tags, data));
};

Console.prototype.info = function (name, timestamp, tags, data) {

    return console.log(this._format('info', name, timestamp, tags, data));
};

Console.prototype.warn = function (name, timestamp, tags, data) {

    return console.log(this._format('warn', name, timestamp, tags, data));
};

Console.prototype.error = function (name, timestamp, tags, data) {

    return console.error(this._format('error', name, timestamp, tags, data));
};

Console.prototype.exception = function (name, timestamp, tags, data) {

    return console.error(this._format('exception', name, timestamp, tags, data));
};

Console.prototype.access = function (name, timestamp, tags, data) {

    var line = this.options.accessFormat;
    line = line.replace(':time', this.options.timestamp ? timestamp.format(this.options.timestamp) : '');
    line = line.replace(':level', Chalk[colors.access](name ? name + '.access' : 'access'));
    line = line.replace(':tags', tags.length ? Chalk.gray('[' + tags.join(',') + ']') : '');
    line = line.replace(':method', data[0].method);
    line = line.replace(':remote_ip', data[0].remote_ip);
    line = line.replace(':url', data[0].url);
    line = line.replace(':http_ver', data[0].http_ver);
    line = line.replace(':status', data[0].status);
    line = line.replace(':response_time', data[0].response_time);
    line = line.replace(':length', data[0].length);
    line = line.replace(':referer', data[0].referer);
    line = line.replace(':agent', data[0].agent);

    return console.log(line);
};

// Console.prototype.stat = function (name, timestamp, tags, data) {
// };

module.exports = Console;
