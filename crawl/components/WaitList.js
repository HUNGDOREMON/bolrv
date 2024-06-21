'use strict';

const async = require('async');
const betGateway = require('../gateway/betGateway');
const oddGateway = require('../gateway/oddGateway');
const userGateway = require('../gateway/userGateway');
const Q = require('../components/Q');
const Event = require('../db/Event');
const WAIT_TIME = 8000;
const LIMIT_BET = 10;
/**
 * Waitlist stores key of wait/queue between trip and driver
 * the key simply is tripId_driverId_timeInMiliseconds
 * every 1s we will check expired key and reset the trip to the queue again to find new driver
 * when driver emit event we just need to check existing key in this list, if it does not exist we will throw an error to user
 */

let isCheckingRunning = false;
let isShutdown = false;
let checkShutdown = false;
/**
 * Checking hash key and auto remove from the waitlist and reassign to the queue *
 * Note: This function just call one time only
 *
 * @returns {void}
 */
exports.shutdown = function (callback) {
    if (!isCheckingRunning) {
        return callback();
    }
    isShutdown = true;
    let intval = setInterval(function () {
        if (checkShutdown) {
            clearInterval(intval);
            return callback();
        }
    }, 2000);
};

exports.autoCheckBet = function () {
    if (!isCheckingRunning) {
        isCheckingRunning = true;
    } else {
        return;
    }

    async.forever(function (done) {
        if (isShutdown) {
            checkShutdown = true;
            return;
        }
        betGateway.findPending(LIMIT_BET).then((data) => {
            // error or empty data, wait some seconds then retry
            // otherwise we will check timestamp in the wishlist and remove expired item
            if (!data.length) {
                return setTimeout(function () {
                    done();
                }, WAIT_TIME);
            }

            // TODO: checking bets
            async.map(data, function (item, cb) {
                setTimeout(function () {
                    oddGateway.findOne({odd_id: item.odd_id}, [{
                        model: Event
                    }], ['Odd.*', 'Event.ss', 'Event.reds', 'Event.time_status', 'Event.time_position'], true)
                        .then(function (event) {
                            let odd = event[item.bet_type];
                            if (String(event.time_status) === String(item.time_status) &&
                            String(event.time_position) === String(item.time_position) &&
                            event.ss === item.ss &&
                            event.reds.home === item.reds.home &&
                            event.reds.away === item.reds.away &&
                            odd[Object.keys(odd)[0]] !== ''
                            ) {
                                console.log(item.id + ' success');
                                item.status = 'runing';
                            } else {
                                console.error('cancel');
                                item.status = 'cancel';
                            }
                            item.last_ss = event.ss;
                            return item.save().then(function () {
                                if (item.status === 'cancel' && item.bet_kind === betGateway.model.statics.KIND.NORMAL) {
                                    return userGateway.updateWallet(item.user_id, item);
                                } else if (item.bet_kind === betGateway.model.statics.KIND.ITEM) {
                                    return Q.checkBetStatus({group_id: item.group_id, bet_id: item.id});
                                }
                            });
                        }).finally(cb);
                }, 15000);
            }, function () {
                setTimeout(function () {
                    console.log('fetch next');
                    done();
                }, 1000);
            });
        }).catch(function (error) {
            console.error('FindPending', error);
            return setTimeout(function () {
                done();
            }, WAIT_TIME);
        });
    }, function (err) {
        // rerun auto check?
        console.log('Waitlist error, need to restart server', err);
    });
};
