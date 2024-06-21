'use strict';

const moment = require('moment-timezone');

/**
 * create specific user id from type and id
 *
 * @param {Object} user object user data
 * @returns {String}
 */
exports.getUserSocketId = function (user) {
    return user.type + '_' + user.id;
};

/**
 * get safe cb function
 *
 * @param {mixed} cb
 * @returns {Function}
 */
exports.safeCb = function (cb) {
    if (typeof cb === 'function') {
        return cb;
    }

    return function () {};
};


/**
 * convert to currency
 */

exports.currency = function (number) {
    number = String(number);
    return number.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
};

/**
 * get fee from setting
 */

exports.getFeeFromSetting = function (setting, distance) {
    distance = parseFloat(distance);
    var ranges = setting.meta ? setting.meta.ranges : null;
    if (!ranges || typeof ranges !== 'object') {
        return 0;
    }

    for (var i = 0; i < ranges.length; i++) {
        var item = ranges[i];
        if (parseInt(item.from) < distance && (!item.to || parseInt(item.to) >= distance)) {
            return parseFloat(item.fee);
        }
    }

    return 0;
};

exports.diffTime = function (date1, date2) {
    var date1 = new Date(date1);
    var date2 = new Date(date2);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var diffMinus = Math.ceil(timeDiff / (1000 * 60));

    return diffMinus;
};

exports.toJson = function (doc) {
    if (!doc) {
        return doc;
    }
    try {
        return JSON.parse(JSON.stringify(doc));
    } catch (e) {
        return null;
    }
};

exports.round = function (number) {
    return Math.round(number);
};

function getNextWeekStart () {
    var today = moment();
    // edited part
    var daystoMonday = 0 - (today.isoWeekday() - 1) + 7;
    var nextMonday = today.subtract(daystoMonday, 'days');
    return nextMonday;
}
exports.getNextWeekStart = getNextWeekStart;

function getNextWeekEnd () {
    var nextMonday = getNextWeekStart();
    var nextSunday = nextMonday.add(6, 'days');
    return nextSunday;
}
exports.getNextWeekEnd = getNextWeekEnd;

function getLastWeekStart () {
    var today = moment();
    var daystoLastMonday = 0 - (1 - today.isoWeekday()) + 7;
    var lastMonday = today.subtract(daystoLastMonday, 'days');
    lastMonday.set({hour: 0, minute: 0, second: 0, millisecond: 0});
    return lastMonday;
}
exports.getLastWeekStart = getLastWeekStart;

function getLastWeekEnd () {
    var lastMonday = getLastWeekStart();
    var lastSunday = lastMonday.add(6, 'days');
    return lastSunday;
}
exports.getLastWeekEnd = getLastWeekEnd;
