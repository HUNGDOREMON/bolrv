'use strict';
const config = require('./../config');
const Redis = require('./Redis');
let store = Redis.getClient(config.REDIS_CACHE_DB);
global.maintain = true;
let cookies = null;
let cookieAuth = null;
let cookieToken= null;
const CACHEKEY_SETTING_MAINTAIN = 'SETTING_MAINTAIN';
// const COOKIE_LIVE = 'COOKIE_LIVE';
const TOKEN_AUTH = 'TOKEN_AUTH';
const TOKEN_DATA = 'TOKEN_DATA';


// function setTokenAuth (value) {
//     // store.set(TOKEN_AUTH, value);

//     // return new Promise(function (resolve, reject) {
//     //     store.set(TOKEN_AUTH, value, function (err, value) {
//     //         if (err) {
//     //             return reject(err);
//     //         }
//     //         resolve(value);
//     //     });
//     // });
//     cookieAuth = value;
// }

// function getTokenAuth () {
//     // return new Promise(async function (resolve, reject) {
//     //     store.get(TOKEN_AUTH, function (err, value) {
//     //         if (err) {
//     //             return reject(err);
//     //         }

//     //         resolve(value);
//     //     });
//     // });
//     return cookieAuth;
// }


// function getTokenData () {
//     // return new Promise(async function (resolve, reject) {
//     //     store.get(TOKEN_DATA, function (err, value) {
//     //         if (err) {
//     //             return reject(err);
//     //         }
//     //         resolve(value);
//     //     });
//     // });
//     return cookieToken;
// }

// function setTokenData (value) {
//     // store.set(TOKEN_DATA, value);

//     // return new Promise(function (resolve, reject) {
//     //     store.set(TOKEN_DATA, value, function (err, value) {
//     //         if (err) {
//     //             return reject(err);
//     //         }
//     //         resolve(value);
//     //     });
//     // });
//     cookieToken = value;
// }


function setMaintainMode (value) {
    global.maintain = value;
    return new Promise(function (resolve, reject) {
        store.set(CACHEKEY_SETTING_MAINTAIN, JSON.stringify({ value: value }), function (err, value) {
            if (err) {
                return reject(err);
            }
            resolve(value);
        });
    });
}

function setCookies (value) {
    cookies = value;
}

function getCookies (value) {
    return cookies;
}

function getMaintainMode () {
    return new Promise(function (resolve, reject) {
        store.get(CACHEKEY_SETTING_MAINTAIN, function (err, value) {
            if (err) {
                return reject(err);
            }
            resolve(value && JSON.parse(value).value);
        });
    });
}

// function setCookiesMlv (value) {
//     store.set(COOKIE_LIVE, value);
// }

// function getCookiesMlv () {
//     return store.get(COOKIE_LIVE);
// }


/**
 * get driver from cache
 *
 * @param {integer} id
 * @param {Function} cb
 * @returns {void}
 */
exports.setMaintainMode = setMaintainMode;
exports.getMaintainMode = getMaintainMode;
exports.setCookies = setCookies;
exports.getCookies = getCookies;
// exports.setCookiesMlv = setCookiesMlv;
// exports.getCookiesMlv = getCookiesMlv;
// exports.setTokenAuth = setTokenAuth;
// exports.getTokenAuth = getTokenAuth;
// exports.getTokenData = getTokenData;
// exports.setTokenData = setTokenData;
