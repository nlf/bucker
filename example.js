var express = require('express'),
    app = express(),
    repl = require('repl'),
    net = require('net'),
    logger = require('./index').createLogger({ access: 'access.log', error: 'error.log', app: 'app.log', console: true }, module);

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
    throw new Error('and catch thrown errors');
});

net.createServer(function (socket) {
    var r = repl.start({
        prompt: '> ',
        input: socket,
        output: socket,
        terminal: true,
        useGlobal: false
    });
    r.on('exit', function () {
        socket.end();
    });
}).listen('./example.sock');

app.listen(8000);
