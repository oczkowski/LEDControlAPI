// Imports
require('dotenv').config();
let redis = require('../redis');

function runSockets(app) {
    let io = require('socket.io')(app);
    io.on('connection', function(socket) {
        // Send hello message
        socket.emit('handshake');

        // Keep rooms up to date. (Broadcasting available rooms)
        async function getRoomData(roomName) {
            let data = await redis.get('DATA_' + roomName);
            let config = await redis.get('CONFIG_' + roomName);
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
            let keys = await redis.keys('*');
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
        redis.listen.on('message', async function(channel, key) {
            if (key.indexOf('LASTCONNECTION_') === 0) {
                // Check if chip is alive
                lastConnected[
                    key.split('LASTCONNECTION_')[1]
                ] = await redis.get(key);
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
                await redis.set(
                    'DATA_' + data.roomName,
                    JSON.stringify(data.data)
                );
            }
        });
        socket.on('update_room_config', async function(data) {
            if ((data.roomName, data.config)) {
                // Get Nominal configuration
                let config = await redis.get('CONFIG_' + data.roomName);
                config = JSON.parse(config);
                // We only want specific properties to be updated (This must be enforced)
                await redis.set(
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
}

module.exports = runSockets;
