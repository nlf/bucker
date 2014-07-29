var BaseTransport = require('../lib/baseTransport');
var Dgram = require('dgram');
var Joi = require('joi');
var Hoek = require('hoek');

var UDP = BaseTransport.extend(function () {

    this.client = Dgram.createSocket('udp4');
    // this.client.unref(); // don't hold the process open
});

UDP.prototype.validate = function (options, callback) {

    var schema = Joi.object().keys({
        host: Joi.string().hostname().default('127.0.0.1'),
        port: Joi.number().integer().required(),
        defaults: Joi.object()
    });

    schema.validate(options, callback);
};

UDP.prototype._send = function (level, name, timestamp, tags, data) {

    var self = this;

    self.client.ref(); // ref to keep the process running

    var payload = Hoek.applyToDefaults(self.options.defaults, {
        time: timestamp.toISOString,
        level: level,
        name: name,
        tags: tags,
        data: data
    });

    var packet = new Buffer(JSON.stringify(payload));

    self.client.send(packet, 0, packet.length, self.options.port, self.options.host, function () {

        self.client.unref(); // we're done, so don't hold the process open any more
    });
};

UDP.prototype.stat = function (name, timestamp, tags, data) {

    this._send('stat', name, timestamp, tags, data);
};

UDP.prototype.debug = function (name, timestamp, tags, data) {

    this._send('debug', name, timestamp, tags, data);
};

UDP.prototype.info = function (name, timestamp, tags, data) {

    this._send('info', name, timestamp, tags, data);
};

UDP.prototype.warn = function (name, timestamp, tags, data) {

    this._send('warn', name, timestamp, tags, data);
};

UDP.prototype.error = function (name, timestamp, tags, data) {

    this._send('error', name, timestamp, tags, data);
};

UDP.prototype.exception = function (name, timestamp, tags, data) {

    this._send('exception', name, timestamp, tags, data);
};

UDP.prototype.access = function (name, timestamp, tags, data) {

    this._send('access', name, timestamp, tags, data);
};

module.exports = UDP;
