var Console = require('../lib/baseTransport').extend();

Console.prototype.info = function () {
    console.log('info', arguments);
};

Console.prototype.warn = function () {
    console.log('warn', arguments);
};

module.exports = Console;
