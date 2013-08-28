var dgram, redis;

function loadRedis() {
    try {
        redis = require('redis');
    } catch (e) {
        throw new Error('Attempted to use redis transport without installing the redis module');
    }
}

var Logstash = module.exports = function (opts, name) {
    if (!(this instanceof Logstash)) return new Logstash(opts, name);

    this.name = name || '';
    this.host = opts.host || '127.0.0.1';

    if (opts.redis) {
        loadRedis();
        this.redis = true;
        this.key = opts.key || 'bucker';
        this.port = opts.port || 6379;
        this.client = redis.createClient(this.port, this.host);
    } else if (opts.udp) {
        dgram = require('dgram');
        this.udp = true;
        this.port = opts.port || 9999;
        this.client = dgram.createSocket('udp4');
    }

};

Logstash.prototype.log = function (time, level, module, data, tags) {
    var packet = {};
    var name = module || this.name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = name;
    packet['@fields'] = { module: name, level: level };
    packet['@message'] = data;

    this.send(packet);
};

Logstash.prototype.access = function (module, data, tags) {
    var packet = {};
    var name = module || this.name;

    packet['@timestamp'] = data.time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker_access';
    packet['@source'] = name;
    packet['@fields'] = {
        url: data.url,
        client: data.remote_ip,
        size: data.length,
        responsetime: data.response_time,
        status: data.status,
        method: data.method,
        http_referrer: data.referer,
        http_user_agent: data.agent,
        http_version: data.http_ver
    };
    packet['@message'] = [data.method, data.url, data.status].join(' ');

    this.send(packet);
};

Logstash.prototype.exception = function (time, module, err, tags) {
    var packet = {};
    var name = module || this.name;

    packet['@timestamp'] = time.toISOString();
    packet['@tags'] = tags;
    packet['@type'] = 'bucker';
    packet['@source'] = name;
    packet['@fields'] = { module: name, level: 'exception', stack: err.stack.split('\n') };
    packet['@message'] = err.stack;

    this.send(packet);
};

Logstash.prototype.send = function (data) {
    var packet = JSON.stringify(data);

    if (this.redis) {
        this.client.publish(this.key, packet);
    } else if (this.udp) {
        packet = new Buffer(packet);
        this.client.send(packet, 0, packet.length, this.port, this.host); 
    }
};
