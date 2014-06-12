var Dgram = require('dgram');

var InfluxDB = require('../lib/baseTransport').extend(function () {
    if (!this.options.host) {
        this.options.host = '127.0.0.1';
    }

    if (!this.options.port) {
        this.options.port = 5551;
    }

    this.client = Dgram.createSocket('udp4');
});

InfluxDB.prototype.stat = function (name, timestamp, tags, data) {

    var payload = JSON.stringify([{ name: data[0], columns: ['value', 'time'], points: [[ data[1], +timestamp ]] }]);
    var packet = new Buffer(payload);
    this.client.send(packet, 0, packet.length, this.options.port, this.options.host);
};

module.exports = InfluxDB;
