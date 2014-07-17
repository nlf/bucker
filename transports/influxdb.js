var Dgram = require('dgram');
var Joi = require('joi');

var InfluxDB = require('../lib/baseTransport').extend(function () {

    this.client = Dgram.createSocket('udp4');
    this.client.unref(); // don't hold the process open
});

InfluxDB.prototype.validate = function (options, callback) {

    var schema = Joi.object().keys({
        host: Joi.string().hostname().default('127.0.0.1'),
        port: Joi.number().integer().default(5551)
    });

    schema.validate(options, callback);
};

InfluxDB.prototype.stat = function (name, timestamp, tags, data) {

    var self = this;

    self.client.ref(); // make sure we send this packet
    var payload = JSON.stringify([{ name: data[0], columns: ['value', 'time'], points: [[ data[1], timestamp.unix() ]] }]);
    var packet = new Buffer(payload);

    self.client.send(packet, 0, packet.length, self.options.port, self.options.host, function () {
        self.client.unref(); // and stop holding the process open again
    });
};

module.exports = InfluxDB;
