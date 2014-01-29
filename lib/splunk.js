var storm;

function loadStorm() {
    try {
        storm = require('splunkstorm');
    } catch (e) {
        throw new Error('Attempted to use splunkstorm transport without installing the splunkstorm module');
    }
}

var SplunkStorm = module.exports = function (opts, name) {
    if (!(this instanceof SplunkStorm)) return new SplunkStorm(opts, name);

    this.name = name || '';
    this.project_id = opts.project_id;
    this.access_token = opts.access_token;
    this.source_host = opts.source_host;
    this.source = opts.source;
    loadStorm();
    this.client = new storm.Log(this.access_token, this.project_id);
    if (opts.hostname) {
        this.client.url = 'https://' + opts.hostname + '/1/inputs/http';
    }
};

SplunkStorm.prototype.log = function (time, level, module, data, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = name;
    packet['@level'] = level;
    packet['@message'] = data;

    this.send(packet);
};

SplunkStorm.prototype.access = function (module, data, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = data.time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker_access';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = module;
    packet['@url'] = data.url;
    packet['@client'] = data.remote_ip;
    packet['@size'] = data.length;
    packet['@responsetime'] = data.response_time;
    packet['@status'] = data.status;
    packet['@method'] = data.method;
    packet['@http_referrer'] = data.referer;
    packet['@http_user_agent'] = data.agent;
    packet['@http_version'] = data.http_ve;
    packet['@message'] = [data.method, data.url, data.status].join(' ');

    this.send(packet);
};

SplunkStorm.prototype.exception = function (time, module, err, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@stack'] = err.stack.split('\n');
    packet['@module'] = module;
    packet['@level'] = 'exception';
    packet['@message'] = err.stack;

    this.send(packet);
};

SplunkStorm.prototype.stat = function (time, module, statName, type, value, tags) {
    var packet = {};
    var name = module || this.name;
    var source = this.source || name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = source;
    if (this.source_host) packet['@source_host'] = this.source_host;
    packet['@module'] = module;
    packet['@level'] = 'stat';
    packet['@name'] = statName;
    packet['@type'] = type;
    packet['@value'] = value;
    packet['@message'] = statName + '(' + type + '): ' + value;

    this.send(packet);
};

SplunkStorm.prototype.send = function (data) {
    this.client.send(data);
};
