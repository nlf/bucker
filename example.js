var express = require('express'),
    app = express(),
    logger = require('./index').createLogger({ access: 'access.log', error: 'error.log', app: { file: 'app.log' }, console: true }, module);

app.use(logger.middleware());
app.use(app.router);
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

app.listen(8000);
