// Imports
require('dotenv').config();
let app = require('http').createServer(handler);

// HTTP server
app.listen(process.env.H_PORT, process.env.H_HOST);
function handler(req, res) {
    res.writeHead(418);
    res.end("I'm a teapot");
}

// Sockets
require('./socket')(app);
