const asyncLib = require('../libs/asyncLib');
const betCheckLib = require('../libs/betCheckLib');
const eventGateway = require('../gateway/eventGateway');
const betGateway = require('../gateway/betGateway');
const oddGateway = require('../gateway/oddGateway');
const timeService = require('../libs/timeService');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkEventEnd Saba running ....');
        return;
    }
    timeout = 3;
    console.log('start checkEventEnd Saba');
    runing = true;
    eventGateway.getActiveEventAndFinish().then(function (data) {
        return asyncLib.eachLimit(data, 2, function (event, callback) {
            run(event, 1, callback);
        });
        // }).then(function () {
        //     return eventGateway.getNewScoreEvent().then(function (data) {
        //         return asyncLib.eachLimit(data, 2, function (event, callback) {
        //             run(event, 2, callback);
        //         });
        //     });
    }).then(function () {
        console.log('crawl checkEventEnd Saba done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl checkEventEnd Saba done with ', err);
        runing = false;
    });
};

function run(event, type, callback) {
    oddGateway.findRuningOdd(event.event_id, type === 2 || String(event.time_status) === '3').then(function (odds) {
        asyncLib.async.mapLimit(odds, 5, function (odd, cb) {
            if (type === 1) {
                checkRuningBet(event, odd, cb);
            } else {
                checkOverUnder(event, odd, cb);
            }
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            if (data.length === odds.length && data.indexOf('skip') === -1) {
                if (type === 2) {
                    event.has_new_score = false;
                } else if (String(event.time_status) === '3') {
                    event.status = 'done';
                } else {
                    console.log('done haft event', event.event_id);
                    event.hf_check = true;
                }
                event.save().then(function () {
                    callback();
                }).catch(callback);
            } else {
                callback();
            }
        });
    }).catch(callback);
}


function checkRuningBet(event, odd, callback) {
    console.log('check odd saba', odd.odd_id);
    betGateway.findRuningByOddId(odd.odd_id, String(event.time_status) === '3').then(data => {
        if (odd.type === 'conner' && event.ss === '0-0') {
            console.log('check event saba conner', odd.odd_id);
            return eventGateway.findOne({ event_id: String(event.parent_id) }).then(function (parent) {
                if (parent.extra.ss.length >= odd.corner_type) {
                    event.ss = parent.extra.ss[parseInt(odd.corner_type) - 1] === 0 ? '1-0' : '0-1';
                    return event.save().then(function () {
                        return data;
                    });
                } else if (String(parent.time_status) !== '3') { // running event
                    return null;
                }
                return data;
            });
        }
        return data;
    }).then((data) => {
        if (!data) {
            console.log('skip event saba', odd.odd_id);
            return 'skip saba';
        }
        if (data.length === 0) {
            if (String(event.time_status) === '3') {
                odd.status = 'done';
            } else {
                console.log('done haft saba odd_id', odd.odd_id);
                odd.hf_check = true;
            }
            return odd.save();
        }
        return checkBetMain(event, odd, data);
    }).then(function (data) {
        if (data === 'skip') {
            callback(null, data);
        } else {
            callback();
        }
    }).catch(callback);
}

function checkOverUnder(event, odd, callback) {
    betGateway.getOverUnder(odd.odd_id).then(function (data) {
        if (!data.length) {
            return;
        }
        return checkBetMain(event, odd, data, true);
    }).then(function () {
        callback();
    }).catch(callback);
}

function checkBetMain(event, odd, data, special = false) {
    return asyncLib.eachLimit(data, 4, function (bet, callback) {
        // console.log('check bet ', odd.odd_id, bet.id);
        let type = 'overUnder';
        let ss = event.ss;
        if (bet.bet_type === 'hf_hdp' || bet.bet_type === 'hf_ou' || bet.bet_type === 'hf_1x2') {
            ss = event.hf_ss;
        }

        let last_ss = ss;
        if (bet.bet_type === 'ft_hdp' || bet.bet_type === 'hf_hdp') {
            console.log(event.id);
            ss = betCheckLib.diffSs(bet.ss, ss);
            type = 'handicap';
        }
        if (bet.bet_type === 'ft_1x2' || bet.bet_type === 'hf_1x2') {
            type = 'odd1x2';
        }

        if (bet.bet_type === 'correct_score') {
            type = 'correct_score';
        }

        var result = betCheckLib[type](ss, bet.odd, bet.bet_value, bet.bet_amount, bet.bet_position, bet.type);
        bet.bet_status = result.status;
        bet.bet_profit = result.profit;
        bet.has_full = result.winVal === 1;
        bet.last_ss = last_ss;
        bet.status = 'done';
        const minutes = timeService.formatTimeMatch(event.start_date);
        if (!special) {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }

        // special case
        if (['hf_ou', 'ft_ou'].indexOf(bet.bet_type) === -1) {
            return callback();
        }

        if (result.winVal !== 1) {
            return callback();
        }
        // const minutes = timeService.formatTimeMatch(event.start_date);
        // console.log(event.start_date,minutes);
        // if ((bet.bet_position === 0 && bet.bet_status === 'won') || (bet.bet_position === 1 && bet.bet_status === 'lose')) {
        if (bet.bet_type === 'hf_ou' && event.time === 'H.Time') {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }
        if (bet.bet_type === 'ft_ou' && event.time_status === 3) {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }
        // }
        return callback();
    });
}
