const asyncLib = require('../libs/asyncLib');
const betCheckLib = require('../libs/betCheckLib');
const eventGateway = require('../gateway/eventGateway');
const betGateway = require('../gateway/betGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkEventCSEnd running ....');
        return;
    }
    timeout = 3;
    console.log('start checkEventCSEnd');
    runing = true;
    // eventGateway.getActiveEventAndFinish().then(function (data) {
    //     return asyncLib.eachLimit(data, 2, function (event, callback) {
    //         run(event, 1, callback);
    //     });
    // }).then(function () {
    //     return eventGateway.getNewScoreEvent().then(function (data) {
    //         return asyncLib.eachLimit(data, 2, function (event, callback) {
    //             run(event, 2, callback);
    //         });
    //     });
    // }).then(function () {
    //     console.log('crawl checkEventCSEnd done');
    //     runing = false;
    // }).catch(function (err) {
    //     console.log('crawl checkEventCSEnd done with ', err);
    //     runing = false;
    // });

    betGateway.findRunningByEventCorrectScropId().then(data => {
        return asyncLib.eachLimit(data, 1000, function (bet, callback) {
            eventGateway.findOne({ event_id: bet.event_id, status: 'done' }).then(function (event, data) {
                if (event) { checkBetMain(event, bet, callback); }
            });
        });
    }).then(function () {
        console.log('crawl checkEventCSEnd done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl checkEventCSEnd done with ', err);
        runing = false;
    });
};


// function checkRuningBetCorrectScope(event, callback) {
//     console.log('check event correct_score', event.event_id);
//     betGateway.findRunningByEventCorrectScropId(event.event_id, String(event.time_status) === '3').then(data => {
//         return data;
//     }).then((data) => {
//         if (!data) {
//             console.log('skip event', event.event_id);
//             return 'skip';
//         }
//         return checkBetMain(event, null, data);
//     });
// }

function checkBetMain(event, bet, callback, special = false) {
    // return asyncLib.eachLimit(data, 4, function (bet, callback) {
    console.log('check bet correct_score', event.event_id, bet.id);
    let ss = event.ss;
    let last_ss = ss;

    var result = betCheckLib['correct_score'](ss, bet.odd, bet.bet_value, bet.bet_amount, bet.bet_position, bet.type);
    bet.bet_status = result.status;
    bet.bet_profit = result.profit;
    bet.has_full = result.winVal === 1;
    bet.last_ss = last_ss;
    bet.status = 'done';
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
    // ou
    // tài and won or xỉu and lose
    if (bet.bet_status === 'won' || bet.bet_status === 'lose') {
        return betGateway.updateBet(bet).then(function () {
            callback();
        }).catch(callback);
    }


    return callback();
    // };
}
