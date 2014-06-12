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

    if (!this.options.hasOwnProperty('format')) {
        this.options.format = ':time :level:tags: :data';
    }
});

Console.prototype._format = function (level, name, timestamp, tags, data) {

    var color = colors[level];
    var line = this.options.format;
    line = line.replace(':time', this.options.timestamp ? timestamp.format(this.options.timestamp) : '');
    line = line.replace(':level', Chalk[color](name ? name + '.' + level : level));
    line = line.replace(':tags', tags.length ? Chalk.gray('[' + tags.join(',') + ']') : '');
    line = line.replace(':data', data.map(function (chunk) { return Util.format(chunk); }).join(' '));

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

    return console.log(this._format('error', name, timestamp, tags, data));
};

Console.prototype.exception = function (name, timestamp, tags, data) {

    return console.log(this._format('exception', name, timestamp, tags, data));
};

// Console.prototype.access = function (name, timestamp, tags, data) {
// };
//
// Console.prototype.stat = function (name, timestamp, tags, data) {
// };

module.exports = Console;
