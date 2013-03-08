var color = require('colors'),
    colors = {
        access: 'grey',
        debug: 'blue',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    };

var Console = module.exports = function (opts, name) {
    if (!(this instanceof Console)) return new Console(opts, name);
    this.timestamp = opts.hasOwnProperty('timestamp') ? opts.timestamp : 'HH:mm:ss';
    this.color = opts.hasOwnProperty('color') ? opts.color : true;
    this.defaultFormat = name ? ':time :name.:level: :data' : ':time :level: :data';
    this.format = opts.hasOwnProperty('format') ? opts.format : this.defaultFormat;
    this.defaultAccessFormat = name ? ':time :name.:level: :method :url :status :res_time' : ':time :level: :method :url :status :res_time';
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : this.defaultAccessFormat;
    this.name = name || '';
};

Console.prototype.log = function (time, level, data) {
    var logFunc = level === 'error' ? console.error : console.log,
        line = this.format,
        color = colors[level];

    if (this.name) line = line.replace(':name', this.name[color]);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = this.color ? line.replace(':level', level[color]) : line.replace(':level', level);
    line = line.replace(':data', data);
    logFunc(line);
};

Console.prototype.access = function (data) {
    var line = this.accessFormat;

    if (this.name) line = line.replace(':name', this.name[colors.access]);
    line = this.timestamp ? line.replace(':time', data.time.format(this.timestamp)) : line.replace(':time ', '');
    line = this.color ? line.replace(':level', 'access'[colors.access]) : line.replace(':level', 'access');
    line = line.replace(':method', data.method);
    line = line.replace(':remote', data.remote_ip);
    line = line.replace(':url', data.url);
    line = line.replace(':http_ver', data.http_ver);
    line = line.replace(':status', data.status);
    line = line.replace(':res_time', data.response_time);
    line = line.replace(':length', data.length);
    line = line.replace(':referer', data.referer);
    line = line.replace(':agent', data.agent);
    console.log(line);
};
