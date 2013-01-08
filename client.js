var net = require('net'),
    sock = net.connect('./example.sock');

process.stdin.pipe(sock);
sock.pipe(process.stdout);

sock.on('connect', function () {
    process.stdin.resume();
    process.stdin.setRawMode(true);
});

sock.on('close', function close() {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    sock.removeListener('close', close);
});

process.stdin.on('end', function () {
    sock.destroy();
    console.log();
});

process.stdin.on('data', function (b) {
    if (b.length === 1 && b[0] === 4) {
        process.stdin.emit('end');
    }
});
