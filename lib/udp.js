var dgram = require('dgram');

function _extend() {
    var o = {};

    for (var i = 0, l = arguments.length; i < l; i++) {
        for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
                o[key] = arguments[i][key];
            }
        }
    }

    return o;
}

var UDP = module.exports = function (opts, name) {
    if (!(this instanceof UDP)) return new UDP(opts, name);

    this.name = name || '';
    this.host = opts.host || '127.0.0.1';
    this.defaults = opts.defaults;
    this.port = opts.port || 9999;
    this.client = dgram.createSocket('udp4');
};

UDP.prototype.log = function (time, level, module, data, tags) {
    var name = module || this.name;
    var message = typeof data === 'string' ? { message: data } : data;
    var packet = _extend(this.defaults, { time: time.toISOString(), level: level, module: name, tags: tags }, message);

    this.send(packet);
};

UDP.prototype.access = function (module, data, tags) {
    var name = module || this.name;
    var message = typeof data === 'string' ? { message: data } : data;
    var packet = _extend(this.defaults, { level: 'access', module: name, tags: tags }, message);

    this.send(packet);
};

UDP.prototype.exception = function (time, module, err, tags) {
    var name = module || this.name;
    var packet = _extend(this.defaults, { time: time.toISOString(), level: 'exception', module: name, tags: tags }, { error: err.message, stack: err.stack });

    this.send(packet);
};

UDP.prototype.stat = function (time, module, statName, type, value, tags) {
    var name = module || this.name;
    var packet = _extend(this.defaults, { time: time.toISOString(), name: statName, module: name, tags: tags, value: value, type: type });

    this.send(packet);
};

UDP.prototype.send = function (data) {
    var packet = JSON.stringify(data);

    packet = new Buffer(packet);
    this.client.send(packet, 0, packet.length, this.port, this.host); 
};
