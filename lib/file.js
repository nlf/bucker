var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

var File = module.exports = function (opts, name) {
    if (!(this instanceof File)) return new File(opts, name);
    this.timestamp = opts.hasOwnProperty('timestamp') ? opts.timestamp : 'YYYY-MM-DDTHH:mm:ss';
    this.defaultFormat = name ? ':time :name.:level:tags: :data' : ':time :level: :data';
    this.format = opts.hasOwnProperty('format') ? opts.format : this.defaultFormat;
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : ':remote - - [:time] ":method :url HTTP/:http_ver" :status :length :res_time ":referer" ":agent"';
    this.defaultExceptionFormat = name ? ':time :name.:level:tags: :message\n :stack' : ':time :level: :message\n :stack';
    this.exceptionFormat = opts.hasOwnProperty('exceptionFormat') ? opts.exceptionFormat : this.defaultExceptionFormat;
    this.filename = typeof opts === 'string' ? opts : opts.filename;
    mkdirp.sync(path.dirname(this.filename));
    this.filestream = fs.createWriteStream(this.filename, { encoding: 'utf8', flags: 'a+' });
    this.name = name || '';
};

File.prototype.log = function (time, level, module, data, tags) {
    var line = this.format;
    var name = module || this.name;
    var tagstring;

    if (name) line = line.replace(':name', name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', level);
    line = line.replace(':data', data);
    tagstring = tags.length ? ('[' + tags.join(',') + ']').grey : '';
    line = line.replace(':tags', tagstring);
    this.filestream.write(line + '\n');
};

File.prototype.access = function (module, data, tags) {
    var line = this.accessFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

    if (name) line = line.replace(':name', name);
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
    line = line.replace(':tags', tagstring);
    this.filestream.write(line + '\n');
};

File.prototype.exception = function (time, module, err, tags) {
    var line = this.exceptionFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

    if (name) line = line.replace(':name', name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', 'exception');
    line = line.replace(':message', err.message);
    line = line.replace(':stack', err.stack);
    line = line.replace(':tags', tagstring);
    this.filestream.write(line + '\n');
};
