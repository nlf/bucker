var color = require('colors');
var colors = {
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
    this.defaultFormat = name ? ':time :name.:level:tags: :data' : ':time :level: :data';
    this.format = opts.hasOwnProperty('format') ? opts.format : this.defaultFormat;
    this.defaultAccessFormat = name ? ':time :name.:level:tags: :method :url :status :res_time' : ':time :level: :method :url :status :res_time';
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : this.defaultAccessFormat;
    this.defaultExceptionFormat = name ? ':time :name.:level:tags: :message\n :stack' : ':time :level: :message\n :stack';
    this.exceptionFormat = opts.hasOwnProperty('exceptionFormat') ? opts.exceptionFormat : this.defaultExceptionFormat;
    this.name = name || '';
};

Console.prototype.log = function (time, level, module, data, tags) {
    var logFunc = level === 'error' ? console.error : console.log;
    var line = this.format;
    var color = colors[level];
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']').grey : '';

    if (name) line = line.replace(':name', name[color]);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = this.color ? line.replace(':level', level[color]) : line.replace(':level', level);
    line = line.replace(':data', data);
    line = line.replace(':tags', tagstring);
    logFunc(line);
};

Console.prototype.access = function (module, data, tags) {
    var line = this.accessFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']').grey : '';

    if (name) line = line.replace(':name', name[colors.access]);
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
    line = line.replace(':tags', tagstring);
    console.log(line);
};

Console.prototype.exception = function (time, module, err, tags) {
    var line = this.exceptionFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']').grey : '';
    
    if (name) line = line.replace(':name', name.red);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', 'exception'.red);
    line = line.replace(':message', err.message);
    line = line.replace(':stack', err.stack);
    line = line.replace(':tags', tagstring);
    console.error(line);
};
