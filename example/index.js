var PORT = 8000,
    express = require('express'),
    app = express(),
    // logger = require('../').createLogger({ udp: { host: '127.0.0.1', port: 3000, default: { host: 'localhost', other: 'randomdata' } } });
    logger = require('../').createLogger({ access: 'access.log', error: 'error.log', app: { file: 'app.log' }, console: true }, module);
    //Redis Example - You'll have to run redis for this example.
    // logger = require('../').createLogger({console: { color: true }, logstash: { redis: true, host: '127.0.0.1', port: 6379, key: 'bucker_logs', channel: false, list: false, source_host: 'bacon.com' }});
app.use(logger.middleware());
app.use(logger.errorHandler());

app.get('*', function (req, res, next) {
    logger.log('log works as info');
    logger.info('so does info');
    logger.debug('we can also debug');
    logger.warn('warn');
    logger.error('or error');
    logger.info('also, access logs via middleware');
    res.send('hello world');
    logger.info('and we can add metadata', { useful: true, verbose: 'definitely' });
    logger.module('testing').info('and override the module name');
    logger.info('without breaking the main instance');
    logger.tags(['and', 'tags']).info('are supported');
});

app.listen(PORT, function(){
    logger.info('Example is running listening on port: ' + PORT);
});
