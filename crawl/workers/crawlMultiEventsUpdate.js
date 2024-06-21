const Q = require('../components/Q');
const _ = require('lodash');
const zpAPI = require('../libs/zpAPIV2');
const oddGateway = require('../gateway/oddGateway');
const asyncLib = require('../libs/asyncLib');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl multi events running ....');
        return;
    }
    timeout = 3;
    console.log('start crawl multi');
    runing = true;
    zpAPI.getMultiEvents().then(function (data) {
        let ids = _.chunk(data, 30);
        return asyncLib.eachLimit(ids, 5,
            function (item, callback) {
                oddGateway.updateParlay(item).then(function () {
                    callback();
                }).catch(callback);
            }
        );
    })
        .then(function (err) {
            console.log('crawl multi event done');
            runing = false;
        }).catch(function (err) {
            console.log('crawl multi event done with ', err);
            runing = false;
        });
};
