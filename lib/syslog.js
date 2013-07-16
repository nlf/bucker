var dgram = require('dgram'),
    os = require('os'),
    levels = {
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

Syslog.prototype.log = function (time, level, module, data) {
    var pri = (this.facility * 8) + levels[level],
        timestamp = time.format('MMM [:day] HH:mm:ss '),
        day = time.format('D'),
        line = '<' + pri + '>',
        name = module || this.name;

    timestamp = day.length === 1 ? timestamp.replace(':day', ' ' + day) : timestamp.replace(':day', day);
    line += timestamp;
    line += os.hostname() + ' ';
    if (name) line += name + ': ';
    line += data;
    line = new Buffer(line);
    this.stream.send(line, 0, line.length, this.port, this.host);
};

Syslog.prototype.access = function (module, data) {
    var line = this.accessFormat,
        name = module || this.name;

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
    this.log(data.time, 'access', line);
};

Syslog.prototype.exception = function (time, module, err) {
    this.log(time, 'exception', err.message + '\n ' + err.stack);
};
