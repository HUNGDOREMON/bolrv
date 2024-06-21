const Q = require('../components/Q');
const zpAPI = require('../libs/zpAPIV2');
const _ = require('lodash');
const eventGateway = require('../gateway/eventGateway');
const oddGateway = require('../gateway/oddGateway');
let runing = false;
let timeout = 2;

module.exports = function () {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl upcoming events running ....');
        return;
    }
    timeout = 2;
    console.log('start crawl upcoming events');
    runing = true;
    zpAPI.getUpcoming().then(function (data) {
        return eventGateway.saveFromAPI(data, 0, false).then(function () {
            let oddIds = [];
            let eventIds = _.map(data, function (item) {
                oddIds.push(item.odd_id);
                return item.event_id;
            });
            return {
                oddIds: oddIds,
                eventIds: eventIds
            }
        });
    })
        .then(function (data) {
            return eventGateway.updateTobeFixEventUpcomming(data.eventIds, false).then(function () {
                return data;
            });
        })
        .then(function (data) {
            return oddGateway.updateToPeding(data.oddIds, 0, false).then(function () {
                return data;
            });
        })
        .then(function (err) {
            console.log('crawl upcoming event done');
            runing = false;
        }).catch(function (err) {
            console.log('crawl upcoming event done with ', err);
            runing = false;
        });
};
