// Imports
require('dotenv').config();
var app = require('http').createServer(handler),
    io = require('socket.io')(app),
    redis = require('redis'),
    redisClient = redis.createClient(process.env.R_PORT, process.env.R_HOST),
    redisListen = redis.createClient(process.env.R_PORT, process.env.R_HOST);

// Promisifying redis
const { promisify } = require('util'),
    getAsync = promisify(redisClient.get).bind(redisClient),
    keysAsync = promisify(redisClient.keys).bind(redisClient),
    setAsync = promisify(redisClient.set).bind(redisClient);

// Redis client
redisClient.on('error', err => console.log(`[Redis-M] Could not connect.`));
redisClient.auth(process.env.R_PASS, resp =>
    console.log(`[Redis-M] Auth successful.`)
);

// Redis listener
redisListen.on('error', err => console.log(`[Redis-L] Could not connect.`));
redisListen.auth(process.env.R_PASS, resp =>
    console.log(`[Redis-L] Auth successful.`)
);
redisListen.config('set', 'notify-keyspace-events', 'KEA');
redisListen.subscribe('__keyevent@0__:set');

// HTTP server
app.listen(process.env.H_PORT, process.env.H_HOST);
function handler(req, res) {
    res.writeHead(418);
    res.end("I'm a teapot");
}

// Sockets
io.on('connection', function(socket) {
    // Send hello message
    socket.emit('handshake', { hello: true });

    // Keep rooms up to date. (Broadcasting available rooms)
    async function getRoomData(roomName) {
        let data = await getAsync('DATA_' + roomName);
        let config = await getAsync('CONFIG_' + roomName);
        try {
            data = JSON.parse(data);
            config = JSON.parse(config);
        } catch (e) {
            data = {};
            config = {};
            console.log(e);
        }
        return { data, config };
    }

    // Fetch all rooms
    socket.on('get_rooms', async function(data) {
        let keys = await keysAsync('*');
        let rooms = {};
        // Get all rooms names
        keys = keys.filter(v => v.indexOf('CONFIG_') === 0);
        keys = keys.map(v => v.split('CONFIG_')[1]);
        // Get all rooms data
        for (let key of keys) rooms[key] = await getRoomData(key);
        socket.emit('rooms', rooms);
    });

    // Listen for redis changes
    var lastConnected = {};
    redisListen.on('message', async function(channel, key) {
        if (key.indexOf('LASTCONNECTION_') === 0) {
            // Check if chip is alive
            lastConnected[key.split('LASTCONNECTION_')[1]] = await getAsync(
                key
            );
            socket.emit('rooms_keepalive', lastConnected);
        }
        if (key.indexOf('CONFIG_') === 0) {
            let room = {};
            key = key.split('CONFIG_')[1];
            room[key] = await getRoomData(key);
            socket.emit('room', room);
        }
        if (key.indexOf('DATA_') === 0) {
            let room = {};
            key = key.split('DATA_')[1];
            room[key] = await getRoomData(key);
            socket.emit('room', room);
        }
    });
    // Update Redis data
    socket.on('update_room_data', async function(data) {
        if ((data.roomName, data.data)) {
            await setAsync('DATA_' + data.roomName, JSON.stringify(data.data));
        }
    });
    socket.on('update_room_config', async function(data) {
        if ((data.roomName, data.config)) {
            // Get Nominal configuration
            let config = await getAsync('CONFIG_' + data.roomName);
            config = JSON.parse(config);
            // We only want specific properties to be updated (This must be enforced)
            await setAsync(
                'CONFIG_' + data.roomName,
                JSON.stringify({
                    ...data.config,
                    MAC_ADDRESS: config.MAC_ADDRESS,
                    LOCAL_IP: config.LOCAL_IP
                })
            );
        }
    });
});
