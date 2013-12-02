var dgram = require('dgram');
var os = require('os');
var levels = {
        debug: 7,
        info: 6,
        access: 5,
        warn: 4,
        error: 3,
        exception: 1
    };

var Syslog = module.exports = function (opts, name) {
    if (!(this instanceof Syslog)) return new Syslog(opts, name);
    this.facility = opts.hasOwnProperty('facility') ? opts.facility : 16;
    this.host = typeof opts === 'string' ? opts : opts.host;
    this.port = opts.hasOwnProperty('port') ? opts.port : 514;
    if (~this.host.indexOf(':')) {
        this.host = this.host.slice(0, this.host.indexOf(':'));
        this.port = this.host.slice(this.host.indexOf(':') + 1);
    }
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : ':remote - - [:time] ":method :url HTTP/:http_ver" :status :length :res_time ":referer" :agent"';
    this.stream = dgram.createSocket('udp4');
    this.name = name || '';
};

Syslog.prototype.log = function (time, level, module, data, tags) {
    if (level === 'stat') level = 'info';
    var pri = (this.facility * 8) + levels[level];
    var timestamp = time.format('MMM [:day] HH:mm:ss ');
    var day = time.format('D');
    var line = '<' + pri + '>';
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

    timestamp = day.length === 1 ? timestamp.replace(':day', ' ' + day) : timestamp.replace(':day', day);
    line += timestamp;
    line += os.hostname() + ' ';
    if (name) line += name + tagstring + ': ';
    line += data;
    line = new Buffer(line);
    this.stream.send(line, 0, line.length, this.port, this.host);
};

Syslog.prototype.access = function (module, data, tags) {
    var line = this.accessFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

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
    this.log(data.time, 'access', line);
};

Syslog.prototype.stat = function (time, module, statName, type, value, tags) {
    this.log(time, 'stat', module, { name: statName, type: type, value: value }, tags).bind(this);
};

Syslog.prototype.exception = function (time, module, err, tags) {
    this.log(time, 'exception', module, err.message + '\n ' + err.stack, tags);
};
