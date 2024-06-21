const asyncLib = require('../libs/asyncLib');
const eventGateway = require('../gateway/eventGateway');
const betGateway = require('../gateway/betGateway');
const oddGateway = require('../gateway/oddGateway');
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
    eventGateway.getRefundEventAndFinish().then(function (data) {
        return asyncLib.eachLimit(data, 2, function (event, callback) {
            run(event, 1, callback);
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

function run (event, type, callback) {
    oddGateway.findRuningOdd(event.event_id, true).then(function (odds) {
        asyncLib.async.mapLimit(odds, 5, function (odd, cb) {
            refundBet(event, odd, cb);
        }, function (err, data) {
            if (err) {
                return callback(err);
            }
            event.status = 'done';
            event.save().then(function () {
                callback();
            }).catch(callback);
        });
    }).catch(callback);
};

function refundBet (event, odd, callback) {
    betGateway.findRuningByOddId(odd.odd_id, true)
        .then((data) => {
            return checkBetMain(event, odd, data);
        }).then(function () {
            odd.status = 'done';
            return odd.save();
        }).then(function () {
            callback();
        }).catch(callback);
}

function checkBetMain (event, odd, data) {
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
