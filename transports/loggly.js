/**
 * Loggly transport
 * @Author: Chris Moyer <cmoyer@newstex.com>
 *
 * Configuring Loggly:
 *    loggly: {
 *      token: 'YOUR LOGGLY TOKEN',
 *      subdomain: 'YOURSUBDOMAIN',
 *      tags: [ 'Optional', 'Tags'],
 *      json: true,
 *    }
 */
'use strict';

var util = require('util');
var BaseTransport = require('../lib/baseTransport');
var Loggly = BaseTransport.extend(function () {
    require('loggly');
});


/**
 * Verify the options are configured properly
 */
Loggly.prototype.validate = function (options, callback) {
    var loggly = require('loggly');
    this.client = loggly.createClient(options);
    this.options = options;
    callback();
};

/**
 * Format an Error object
 */
Loggly.prototype.formatError = function (err) {
    return {
        msg: err.message,
        stack: err.stack,
        args: err.arguments,
        type: err.type,
        name: err.name,
    };
};

/**
 * Send a message to Loggly
 */
Loggly.prototype._send = function (level, name, timestamp, tags, data) {
    var self = this;

    if (!Array.isArray(data)){
        data = [data];
    }

    // Process each message
    data.forEach(function(msg){
        var payload = {
            '@timestamp': timestamp.toISOString(),
            '@level': level,
            '@name': name,
            '@tags': tags,
        };

        if (typeof msg === 'object'){
            Object.keys(msg).forEach(function(k){
                var val = msg[k];
                if (val instanceof Error){
                    val = self.formatError(val);
                }
                payload[k] = val;
            });
        } else {
            payload.message = util.format(msg);
        }
        self.client.log(payload);
    });
};

Loggly.prototype.stat = function (name, timestamp, tags, data) {
    this._send('stat', name, timestamp, tags, data);
};

Loggly.prototype.debug = function (name, timestamp, tags, data) {
    this._send('debug', name, timestamp, tags, data);
};

Loggly.prototype.info = function (name, timestamp, tags, data) {
    this._send('info', name, timestamp, tags, data);
};

Loggly.prototype.warn = function (name, timestamp, tags, data) {
    this._send('warn', name, timestamp, tags, data);
};

Loggly.prototype.error = function (name, timestamp, tags, data) {
    this._send('error', name, timestamp, tags, data);
};

Loggly.prototype.exception = function (name, timestamp, tags, data) {
    this._send('exception', name, timestamp, tags, util.format(data));
};

Loggly.prototype.access = function (name, timestamp, tags, data) {
    this._send('access', name, timestamp, tags, data);
};

module.exports = Loggly;
