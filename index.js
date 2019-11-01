var app = require('http').createServer(handler),
    io = require('socket.io')(app),
    redis = require('redis');

app.listen(80);

// HTTP server
function handler(req, res) {
    res.writeHead(418);
    res.end("I'm a teapot");
}
