var Util = require('util');

var Base = function (events, levels, options, name) {
    this.events = events;
    this.levels = levels;
    this.options = options;
    this.name = name;

    for (var i = options.level, l = levels.length; i < l; i++) {
        var event = levels[i];
        events.on(event, Base.caller.prototype[event].bind(this));
    }
};

Base.prototype.debug = function () {};
Base.prototype.info = function () {};
Base.prototype.warn = function () {};
Base.prototype.error = function () {};
Base.prototype.exception = function () {};
Base.prototype.access = function () {};
Base.prototype.metric = function () {};

exports.extend = function () {
    var extended = function () {
        Base.apply(this, arguments);
    };
    Util.inherits(extended, Base);

    return extended;
};
