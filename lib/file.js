var fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path');

var File = module.exports = function (opts, name) {
    if (!(this instanceof File)) return new File(opts, name);
    this.timestamp = opts.hasOwnProperty('timestamp') ? opts.timestamp : 'YYYY-MM-DDTHH:mm:ss';
    this.defaultFormat = name ? ':time :name.:level: :data' : ':time :level: :data';
    this.format = opts.hasOwnProperty('format') ? opts.format : this.defaultFormat;
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : ':remote - - [:time] ":method :url HTTP/:http_ver" :status :length :res_time ":referer" :agent"';
    this.filename = typeof opts === 'string' ? opts : opts.filename;
    mkdirp.sync(path.dirname(this.filename));
    this.filestream = fs.createWriteStream(this.filename, { encoding: 'utf8', flags: 'a+' });
    this.name = name || '';
};

File.prototype.log = function (time, level, data) {
    var line = this.format;

    if (this.name) line = line.replace(':name', this.name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', level);
    line = line.replace(':data', data);
    this.filestream.write(line + '\n');
};

File.prototype.access = function (data) {
    var line = this.accessFormat;

    if (this.name) line = line.replace(':name', this.name);
    line = line.replace(':remote', data.remote_ip);
    line = line.replace(':time', data.time.toDate().toUTCString());
    line = line.replace(':method', data.method);
    line = line.replace(':url', data.url);
    line = line.replace(':http_ver', data.http_ver);
    line = line.replace(':status', data.status);
    line = line.replace(':res_time', data.response_time);
    line = line.replace(':length', data.length);
    line = line.replace(':referer', data.referer);
    line = line.replace(':agent', data.agent);
    this.filestream.write(line + '\n');
};
