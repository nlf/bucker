var dgram = require('dgram'),
    os = require('os'),
    levels = {
        debug: 7,
        info: 6,
        access: 5,
        warn: 4,
        error: 3
    };

var Syslog = module.exports = function (opts) {
    if (!(this instanceof Syslog)) return new Syslog(opts);
    this.facility = opts.hasOwnProperty('facility') ? opts.facility : 16;
    this.host = typeof opts === 'string' ? opts : opts.host;
    this.port = opts.hasOwnProperty('port') ? opts.port : 514;
    if (~this.host.indexOf(':')) {
        this.host = this.host.slice(0, this.host.indexOf(':'));
        this.port = this.host.slice(this.host.indexOf(':') + 1);
    }
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : ':remote - - [:time] ":method :url HTTP/:http_ver" :status :length ":referer" :agent"';
    this.stream = dgram.createSocket('udp4');
    this.name = opts.hasOwnProperty('name') ? opts.name : '';
};

Syslog.prototype.log = function (time, level, data) {
    var pri = (this.facility * 8) + levels[level],
        timestamp = time.format('MMM [:day] HH:mm:ss '),
        day = time.format('D'),
        line = '<' + pri + '>';

    timestamp = day.length === 1 ? timestamp.replace(':day', ' ' + day) : timestamp.replace(':day', day);
    line += timestamp;
    line += os.hostname() + ' ';
    if (this.name) line += this.name + ': ';
    line += data;
    line = new Buffer(line);
    this.stream.send(line, 0, line.length, this.port, this.host);
};

Syslog.prototype.access = function (data) {
    var line = this.accessFormat;
    line = line.replace(':remote', data.remote_ip);
    line = line.replace(':time', data.time.toDate().toUTCString());
    line = line.replace(':method', data.method);
    line = line.replace(':url', data.url);
    line = line.replace(':http_ver', data.http_ver);
    line = line.replace(':status', data.status);
    line = line.replace(':length', data.length);
    line = line.replace(':referer', data.referer);
    line = line.replace(':agent', data.agent);
    this.log(data.time, 'access', line);
};
