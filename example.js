var express = require('express'),
    app = express(),
    bucker = require('./index'),
    logger = bucker({ access: 'access.log', error: 'error.log', app: 'app.log', console: true }, module);

app.use(logger.middleware());

app.get('/', function (req, res) {
    logger.log('log works as info');
    logger.info('so does info');
    logger.debug('we can also debug');
    logger.warn('warn');
    logger.error('or error');
    logger.info('also, access logs via middleware');
    res.send('hello world');
    logger.info('and we can add metadata', { useful: true, verbose: 'definitely' });
});

app.listen(8000);
