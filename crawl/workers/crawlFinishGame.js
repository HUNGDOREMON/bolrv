const numberGameGateway = require('../gateway/numberGameGateway');
const asyncLib = require('../libs/asyncLib');
const oddslib = require('../libs/oddslib');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl crawlFinishGame running ....');
        return;
    }
    timeout = 3;
    console.log('start crawlFinishGame events');
    runing = true;
    numberGameGateway.getGameNeedFinish().then(function (data) {
        return asyncLib.eachLimit(data, 2,
            function (item, callback) {
                item.last_ball = oddslib.randomNumberGame(item.ball_numbers);
                var list = item.ball_numbers;
                list.push(item.last_ball);
                item.ball_numbers = list;
                item.step = 3;
                item.status = 'closed';
                item.save().then(function (argument) {
                    callback();
                }).catch(function (e) {
                    callback(e);
                });
                // numberGameGateway.upsert(item, {'event_id': item.event_id}).then(function () {
                //     callback();
                // }).catch(callback);
            }
        );
    })
        .then(function () {
            return numberGameGateway.getGameNeedFinishStep().then(function (data) {
                return asyncLib.eachLimit(data, 2,
                    function (item, callback) {
                        const list = item.ball_numbers;
                        for (let i = 0; i < 3 - list.length; i++) {
                            item.last_ball = oddslib.randomNumberGame(list);
                            list.push(item.last_ball);
                        }

                        item.ball_numbers = list;
                        item.step = 3;
                        item.status = 'closed';
                        item.save().then(function (argument) {
                            callback();
                        }).catch(function (e) {
                            callback(e);
                        });
                    }
                );
            });
        })
        .then(() => {
            console.log('crawl crawlFinishGame done');
            runing = false;
        }).catch(function (err) {
            console.log('crawl crawlFinishGame done with ', err);
            runing = false;
        });
};
