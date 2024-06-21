const _ = require('lodash');
const zpAPI = require('../libs/zpAPIV2');
const zpCSAPI = require('../libs/zpCSAPIV2');
const eventGateway = require('../gateway/eventGateway');
const oddGateway = require('../gateway/oddGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl inplay events running ....');
        return;
    }
    timeout = 3;
    console.log('start crawl inplay events');
    runing = true;
    zpAPI.getInplay().then(function (data) {
        return eventGateway.saveFromAPI(data, 1, false).then(function () {
            let oddIds = [];
            let eventIds = _.map(data, function (item) {
                oddIds.push(item.odd_id);
                return item.event_id;
            });
            return {
                oddIds: oddIds,
                eventIds: eventIds
            };
        });
    }).then(function (data) {
        return eventGateway.updatefinishEvent(data.eventIds, false).then(function () {
            return data;
        });
    }).then(function (data) {
        return eventGateway.updateTobeFixEvent(data.eventIds).then(function () {
            return data;
        });
    }).then(function (data) {
        return oddGateway.updateToPeding(data.oddIds, 1, false).then(function () {
            return data;
        });
    }).then(() => {
        console.log('crawl inplay event done');
        zpCSAPI.getInplay();
        console.log('crawl inplay event done CS');
        runing = false;
    }).catch(function (err) {
        console.log('crawl inplay event done with ', err);
        runing = false;
    });
};
