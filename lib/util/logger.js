'use strict';

var winston = require('winston'),
    moment = require('moment'),
    args = require('yargs').argv,

    DEFAULTS = {
        level: 'debug',
        align: true,
        name: 'main',
        json: false,
        colorize: false
    },

    _loggers = {},
    _options = Object.assign({}, DEFAULTS);

process.setMaxListeners(20);

winston.handleExceptions(
    process.env.LOG_LOCATION === 'console'
        ? new winston.transports.Console({
        humanReadableUnhandledException: true,
        align: _options.align,
        timestamp: function () {
            return moment().format('MM/DD/YY HH:mm:ss.SSS');
        }
    })
        : new winston.transports.File({
        filename: process.env.LOG_PATH || './app.log',
        humanReadableUnhandledException: true,
        align: _options.align,
        timestamp: function () {
            return moment().format('MM/DD/YY HH:mm:ss.SSS');
        }
    }));

function configure(options) {
    _options = Object.assign(_options, options);
}

function logger(arg) {
    var name = (typeof arg) === 'string' ? arg : undefined,
        options = (typeof arg) === 'object' ? arg : {},
        logger;

    options = Object.assign({}, _options, options);
    options.level = args.loglevel || options.level;
    name = name || options.name;

    if (!_loggers[name]) {
        winston.loggers.add(name, {
            transports: [
                process.env.LOG_LOCATION === 'console'
                    ? new winston.transports.Console({
                    level: options.level,
                    colorize: options.colorize,
                    label: name.toUpperCase(),
                    json: options.json,
                    prettyPrint: true,
                    align: options.align,
                    showLevel: true,
                    timestamp: function () {
                        return moment().format('MM/DD/YY HH:mm:ss.SSS');
                    }
                })
                    : new winston.transports.File({
                    level: options.level,
                    colorize: options.colorize,
                    filename: process.env.LOG_LOCATION || './app.log',
                    label: name.toUpperCase(),
                    json: options.json,
                    prettyPrint: true,
                    align: options.align,
                    showLevel: true,
                    timestamp: function () {
                        return moment().format('MM/DD/YY HH:mm:ss.SSS');
                    }
                })
            ]
        });

        logger = winston.loggers.get(name);

        logger.configure = configure;

        _loggers[name] = logger;
    }

    return _loggers[name];
}

logger.configure = function (options) {
    _options = Object.assign(_options, options);
};

logger.gulpify = function () {
    var util = require('util'),
        gutil = require('gulp-util');

    function GulpTransport(opts) {
        winston.Transport.call(this, opts);
    }

    util.inherits(GulpTransport, winston.Transport);

    GulpTransport.prototype.log = function (level, msg, meta, cb) {
        gutil.log(msg);
        cb(null, true);
    };

    winston.add(GulpTransport);
};

module.exports = logger;

