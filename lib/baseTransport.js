var Utils = require('./utils');

function BaseTransport(events, options) {

    this.events = events;
    this.levels = Utils.levels;

    this.validate(Utils.clean(options), function (err, opts) {

        if (err) {
            throw err;
        }

        this.options = opts;
    }.bind(this));

    for (var i = options.level, l = Utils.levels.length; i < l; i++) {

        var event = Utils.levels[i];
        events.on(event, this[event].bind(this));
    }
}

BaseTransport.prototype.debug = function () {};
BaseTransport.prototype.info = function () {};
BaseTransport.prototype.warn = function () {};
BaseTransport.prototype.error = function () {};
BaseTransport.prototype.exception = function () {};
BaseTransport.prototype.access = function () {};
BaseTransport.prototype.stat = function () {};

exports.BaseTransport = BaseTransport;
exports.extend = function (constructor) {

    function Transport() {

        BaseTransport.apply(this, arguments);

        if (typeof constructor === 'function') {
            constructor.call(this);
        }
    }

    Transport.prototype = Object.create(BaseTransport.prototype);
    Transport.prototype.constructor = Transport;

    return Transport;
};
