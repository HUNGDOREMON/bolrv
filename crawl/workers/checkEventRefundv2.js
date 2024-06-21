const asyncLib = require('../libs/asyncLib');
const matchGateway = require('../gateway/matchGateway');
const betGateway = require('../gateway/betGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkEventRefund running ....');
        return;
    }
    timeout = 3;
    console.log('start checkEventRefund');
    runing = true;
    matchGateway.getRefundEventAndFinish().then(function (data) {
        return asyncLib.eachLimit(data, 2, function (event, callback) {
            refundBet(event, callback);
        });
    })
        .then(function () {
            console.log('crawl checkEventRefund done');
            runing = false;
        }).catch(function (err) {
            console.log('crawl checkEventRefund done with ', err);
            runing = false;
        });
};

function refundBet(match, callback) {
    console.log('Check match refund', match.match_group_id);
    betGateway.findRunningByEventId(match.match_group_id, true)
        .then((data) => {
            return checkBetMain(match, data);
        }).then(function () {
            match.refund_check = true;
            return match.save();
        }).then(function () {
            callback();
        }).catch(callback);
}

function checkBetMain(event, data) {
    return asyncLib.eachLimit(data, 4, function (bet, callback) {
        bet.bet_status = 'refund';
        bet.bet_profit = 0;
        bet.last_ss = event.ss;
        bet.status = 'done';
        return betGateway.updateBet(bet).then(function () {
            callback();
        }).catch(callback);
    });
}
