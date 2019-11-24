// Imports
require('dotenv').config();
let redis = require('redis');

// Establish connection
let redisClient = redis.createClient(process.env.R_PORT, process.env.R_HOST);
let redisListen = redis.createClient(process.env.R_PORT, process.env.R_HOST);

// Promisifying Redis
const { promisify } = require('util'),
    getAsync = promisify(redisClient.get).bind(redisClient),
    keysAsync = promisify(redisClient.keys).bind(redisClient),
    setAsync = promisify(redisClient.set).bind(redisClient);

// Redis client
redisClient.on('error', err => console.log(`[Redis-R] Could not connect.`));
redisClient.auth(process.env.R_PASS, resp =>
    console.log(`[Redis-R] Auth successful.`)
);

// Redis listener
redisListen.on('error', err => console.log(`[Redis-L] Could not connect.`));
redisListen.auth(process.env.R_PASS, resp =>
    console.log(`[Redis-L] Auth successful.`)
);
// Subscribing to redis ket SET
redisListen.config('set', 'notify-keyspace-events', 'KEA');
redisListen.subscribe('__keyevent@0__:set');

// Exporting
module.exports = {
    /* Actions */
    get: getAsync,
    keys: keysAsync,
    set: setAsync,
    /* Instances */
    listen: redisListen
};
