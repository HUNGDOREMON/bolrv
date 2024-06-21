'use strict';
const config = require('../config');
const Redis = require('./Redis');
let store = Redis.getClient(config.REDIS_CACHE_DB);

const SETTING_COOKIE_TV = 'COOKIE_LIVE';

function setCookiesMlv (value) {
    return new Promise(function (resolve, reject) {
        store.set(SETTING_COOKIE_TV, JSON.stringify({value: value}), function (err, value) {
            if (err) {
                return reject(err);
            }
            resolve(value);
        });
    });
}

function getCookiesMlv () {
    return new Promise(function (resolve, reject) {
        store.get(SETTING_COOKIE_TV, function (err, value) {
            if (err) {
                return reject(err);
            }
            resolve(value && JSON.parse(value).value);
        });
    });
}

/**
 * get driver from cache
 *
 * @param {integer} id
 * @param {Function} cb
 * @returns {void}
 */
exports.setCookiesMlv = setCookiesMlv;
exports.getCookiesMlv = getCookiesMlv;
