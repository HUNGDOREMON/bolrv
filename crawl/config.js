'use strict';

var _ = require('lodash');
var envConfig = require('dotenv').config();
console.log(' envConfig ', envConfig);

module.exports = _.assign(envConfig, {
    redis: {
        host: envConfig.REDIS_HOST,
        port: envConfig.REDIS_PORT,
        pass: envConfig.REDIS_PASSWORD
    },
    app: {
        name: 'Yoko'
    },
    http: {
        port: 8080
    },
    queueDB: 3,
    socketsStorageDb: 2,
    REDIS_CACHE_DB: 0
});
