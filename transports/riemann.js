var protobuf = require('protobuf.js');
var proto2json = require('node-proto2json');
var Joi = require('joi');

var riemann = require('../lib/baseTransport').extend(function () {

    this.client = Dgram.createSocket('udp4');
    this.client.unref(); // don't hold the process open
    this.pb;

    proto2json.parse(fs.readFileSync('./riemann.proto', 'utf8'), function cb(err, result) {
        this.pb = new protobuff(result);
    });
});

riemann.prototype.validate = function (options, callback) {

    var schema = Joi.object().keys({
        host: Joi.string().hostname().default('127.0.0.1'),
        port: Joi.number().integer().default(5555)
    });

    schema.validate(options, callback);
};

riemann.prototype.stat = function (name, timestamp, tags, data) {

    var self = this;

    self.client.ref(); // make sure we send this packet
    var payload = self.pb.encode('Event', { time: timestamp, state: 'ok', host: name, tags: tags, service: data[0], metric_d: data[1] });
    var packet = new Buffer(payload);

    self.client.send(packet, 0, packet.length, self.options.port, self.options.host, function () {
        self.client.unref(); // and stop holding the process open again
    });
};

module.exports = riemann;
