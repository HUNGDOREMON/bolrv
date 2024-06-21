const Q = require('../components/Q');
const _ = require('lodash');
const zpAPI = require('../libs/zpAPINumberGame');
const numberGameGateway = require('../gateway/numberGameGateway');
const asyncLib = require('../libs/asyncLib');
let runing = false;
let timeout = 3;

module.exports = function () {
    // if (global.maintain) {
    //     return;
    // }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl inplay events running ....');
        return;
    }
    timeout = 3;
    console.log('start crawl inplay events');
    runing = true;
    zpAPI.getInplay().then(function (data) {
        return asyncLib.eachLimit(data, 2,
            function (item, callback) {
                numberGameGateway.upsert(item, {'event_id': item.event_id}).then(function () {
                    callback();
                }).catch(callback);
            }
        );
    })
    .then(function (err) {
        console.log('crawl inplay event done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl inplay event done with ', err);
        runing = false;
    });
};
