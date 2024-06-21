'use strict';

const redis = require('redis');
const config = require('../config');

exports.getClient = function (storeDb) {
    const store = redis.createClient({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        auth_pass: config.REDIS_PASSWORD
    });

    store.select(storeDb);
    store.on('error', function (err) {
        console.error('Redis error: ' + err);
    });

    process.on('exit', function (code) {
        console.log('Exit with code:', code);
        // store.flushdb(); //TODO Why we need this 1?
    });
    return store;
};
