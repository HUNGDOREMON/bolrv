const Q = require('../components/Q');
const numberGameGateway = require('../gateway/numberGameGateway');
const betGateway = require('../gateway/betGateway');
const asyncLib = require('../libs/asyncLib');
const betCheckLib = require('../libs/betCheckLib');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl crawl End Game running ....');
        return;
    }
    timeout = 3;
    console.log('start crawl End Game events');
    runing = true;
    numberGameGateway.getGameCheck().then(function (data) {
        return asyncLib.eachLimit(data, 2,
            function (item, callback) {
                checkEndBet(item, callback);
            }
        );
    })
    .then(function (err) {
        console.log('crawl crawl End Game done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl crawl End Game done with ', err);
        runing = false;
    });
}

function checkEndBet(item, callback) {
    let length = 0;
    betGateway.findBetGame(item.event_id, item.step).then(function (data) {
        length = data.length;
        return asyncLib.eachLimit(data, 2, function (bet, cb) {
            checkBetDone(item, bet, cb);
        })
    }).then(function () {
        if (!length && item.status == 'closed') {
            item.is_check = true;
            return item.save();
        }
    }).then(function () {
        callback();
    }).catch(function (e) {
        callback();
    })
}

function checkBetDone(game, bet, callback) {
    let ball = game.ball_numbers[bet.number_step];
    var result = betCheckLib[bet.bet_type](ball, bet.bet_value, bet.bet_amount, bet.bet_position);
    bet.bet_status = result.status;
    bet.bet_profit = result.profit;
    bet.last_ss = ball;
    bet.status = 'done';
    return betGateway.updateBet(bet).then(function () {
        callback();
    }).catch(callback);

    return callback();
}
