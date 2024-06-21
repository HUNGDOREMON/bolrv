'use strict';
const config = require('../config');
const Redis = require('./Redis');
let store = Redis.getClient(config.REDIS_CACHE_DB);
let cookieAuth = null;

function setTokenAuth (value) {
    // store.set(TOKEN_AUTH, value);

    // return new Promise(function (resolve, reject) {
    //     store.set(TOKEN_AUTH, value, function (err, value) {
    //         if (err) {
    //             return reject(err);
    //         }
    //         resolve(value);
    //     });
    // });
    cookieAuth = value;
}

function getTokenAuth () {
    // return new Promise(async function (resolve, reject) {
    //     store.get(TOKEN_AUTH, function (err, value) {
    //         if (err) {
    //             return reject(err);
    //         }

    //         resolve(value);
    //     });
    // });
    return cookieAuth;
}

/**
 * get driver from cache
 *
 * @param {integer} id
 * @param {Function} cb
 * @returns {void}
 */
exports.setTokenAuth = setTokenAuth;
exports.getTokenAuth = getTokenAuth;
