var Util = require('util');
var Fs = require('fs');
var Joi = require('joi');
var BaseTransport = require('../lib/baseTransport');

var File = BaseTransport.extend(function () {

    this.filestream = Fs.createWriteStream(this.options.filename, { encoding: 'utf8', flags: 'a+' });
});

File.prototype.validate = function (options, callback) {

    var schema = Joi.object().keys({
        timestamp: Joi.string().default('YYYY-MM-DDTHH:mm:ss'),
        format: Joi.string().default(':time :level:tags: :data'),
        accessFormat: Joi.string().default(':remote_ip - - [:time] ":method :url HTTP/:http_ver" :status :length :response_time ":referer" ":agent"'),
        filename: Joi.string().required()
    });

    schema.validate(options, callback);
};

File.prototype._write = function (line) {

    this.filestream.write(line + '\n');
};

File.prototype._format = function (level, name, timestamp, tags, data) {

    var line = this.options.format;
    line = line.replace(':time', this.options.timestamp ? timestamp.format(this.options.timestamp) : '');
    line = line.replace(':level', name ? name + '.' + level : level);
    line = line.replace(':tags', tags.length ? '[' + tags.join(',') + ']' : '');
    line = line.replace(':data', Util.format.apply(null, data));

    return line;
};

File.prototype.debug = function (name, timestamp, tags, data) {

    this._write(this._format('debug', name, timestamp, tags, data));
};

File.prototype.info = function (name, timestamp, tags, data) {

    this._write(this._format('info', name, timestamp, tags, data));
};

File.prototype.warn = function (name, timestamp, tags, data) {

    this._write(this._format('warn', name, timestamp, tags, data));
};

File.prototype.error = function (name, timestamp, tags, data) {

    this._write(this._format('error', name, timestamp, tags, data));
};

File.prototype.exception = function (name, timestamp, tags, data) {

    this._write(this._format('exception', name, timestamp, tags, data));
};

File.prototype.access = function (name, timestamp, tags, data) {

    var line = this.options.accessFormat;
    line = line.replace(':time', this.options.timestamp ? timestamp.format(this.options.timestamp) : '');
    line = line.replace(':level', name ? name + '.access' : 'access');
    line = line.replace(':tags', tags.length ? '[' + tags.join(',') + ']' : '');
    line = line.replace(':method', data[0].method);
    line = line.replace(':remote_ip', data[0].remote_ip);
    line = line.replace(':url', data[0].url);
    line = line.replace(':http_ver', data[0].http_ver);
    line = line.replace(':status', data[0].status);
    line = line.replace(':response_time', data[0].response_time);
    line = line.replace(':length', data[0].length);
    line = line.replace(':referer', data[0].referer);
    line = line.replace(':agent', data[0].agent);

    return this._write(line);
};

module.exports = File;
