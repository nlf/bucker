var Path = require('path');

exports.levels = ['debug', 'info', 'warn', 'error', 'exception', 'access', 'stat'];

exports.clone = function (source) {

    var target = {};
    for (var key in source) {
        target[key] = source[key];
    }

    return target;
};

exports.clean = function (obj, keys) {

    keys = keys || ['level', 'name', 'email', 'transport'];
    var target = exports.clone(obj);
    keys.forEach(function (key) {

        delete target[key];
    });

    return target;
};

exports.validateLevel = function (level) {

    if (!level) {
        return 0;
    }

    if (typeof level === 'string') {
        if (!isNaN(+level)) {
            level = +level;
        }
        else {
            level = exports.levels.indexOf(level);
        }
    }

    var max = exports.levels.length - 3;
    // if level < 0, return 0
    // if level > 'exception' return 'exception'
    // this is to make sure the access and stat levels are always hit
    return level < 0 ? 0 : level > max ? max : level;
};

exports.getNameFromParent = function (parent) {

    // if parent is a string, pass it through
    // if parent is a module, get the basename minus the .js
    // otherwise no idea, just make it a blank string
    return typeof parent === 'string' ? parent
        : parent && parent.filename ? Path.basename(parent.filename, '.js')
        : '';
};
