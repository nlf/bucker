var Dgram = require('dgram');

var InfluxDB = require('../lib/baseTransport').extend(function () {
    if (!this.options.host) {
        this.options.host = '127.0.0.1';
    }

    if (!this.options.port) {
        this.options.port = 5551;
    }

    this.client = Dgram.createSocket('udp4');
    this.client.unref(); // don't hold the process open
});

InfluxDB.prototype.stat = function (name, timestamp, tags, data) {

    var self = this;

    self.client.ref(); // make sure we send this packet
    var payload = JSON.stringify([{ name: data[0], columns: ['value', 'time'], points: [[ data[1], +timestamp ]] }]);
    var packet = new Buffer(payload);

    self.client.send(packet, 0, packet.length, self.options.port, self.options.host, function () {
        self.client.unref(); // and stop holding the process open again
    });
};

module.exports = InfluxDB;
