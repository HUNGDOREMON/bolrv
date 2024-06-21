const asyncLib = require('../libs/asyncLib');
const betCheckLib = require('../libs/betCheckLib');
const matchGateway = require('../gateway/matchGateway');
const betGateway = require('../gateway/betGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkEventEnd running ....');
        return;
    }
    timeout = 3;
    console.log('start checkEventEnd');
    runing = true;
    matchGateway.getActiveEventAndFinish().then(function (data) {
        return asyncLib.eachLimit(data, 2, function (match, callback) {
            checkRuningBet(match, callback);
        });
    }).then(function () {
        console.log('crawl checkEventEnd done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl checkEventEnd done with ', err);
        runing = false;
    });
};

function checkRuningBet(match, callback) {
    console.log('check match', match.match_group_id);
    betGateway.findRunningByEventId(match.match_group_id, String(match.match_over) === '1')
        .then((data) => {
            if (!data) {
                console.log('skip event', match.match_group_id);
                return;
            }
            if (data.length === 0) {
                if (String(match.match_over) === '1') {
                    match.ft_check = true;
                    match.hf_check = true;
                } else {
                    console.log('done haft odd_id', match.match_group_id);
                    match.hf_check = true;
                }
                return match.save();
            }
            return checkBetMain(match, data);
        }).then(() => {
            callback();
        }).catch(callback);
}

function checkBetMain(match, data) {
    return asyncLib.eachLimit(data, 4, function (bet, callback) {
        console.log('Check finish bet', match.id, bet.id);
        let type = 'overUnder';
        let ss = match.home_score + '-' + match.away_score;
        if (bet.bet_type === 'hf_hdp' || bet.bet_type === 'hf_ou' || bet.bet_type === 'hf_1x2') {
            ss = match.ht_home_score + '-' + match.ht_away_score;
        }

        let lastSs = ss;
        if (bet.bet_type === 'ft_hdp' || bet.bet_type === 'hf_hdp') {
            ss = betCheckLib.diffSs(bet.ss, ss);
            type = 'handicap';
        }
        if (bet.bet_type === 'ft_1x2' || bet.bet_type === 'hf_1x2') {
            type = 'odd1x2';
        }
	
        if (bet.bet_type === 'correct_score') {
            type = 'correct_score';
        }

        var result = betCheckLib[type](ss, bet.odd, bet.bet_value, bet.bet_amount, bet.bet_position);
        bet.bet_status = result.status;
        bet.bet_profit = result.profit;
        bet.has_full = result.winVal === 1;
        bet.last_ss = lastSs;
        bet.status = 'done';
        if (['hf_ou', 'ft_ou'].indexOf(bet.bet_type) === -1) {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }
        // if ((bet.bet_position === 0 && bet.bet_status === 'won') || (bet.bet_position === 1 && bet.bet_status === 'lose')) {
        if (bet.bet_type === 'hf_ou' && match.match_over_1h === 1) {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }
        if (bet.bet_type === 'ft_ou' && match.match_over === 1) {
            return betGateway.updateBet(bet).then(function () {
                callback();
            }).catch(callback);
        }
        // }
    });
}
