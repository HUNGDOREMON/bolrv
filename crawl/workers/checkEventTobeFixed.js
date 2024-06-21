const _ = require('lodash');
const eventGateway = require('../gateway/eventGateway');
const matchGateway = require('../gateway/matchGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkEventTobeFixed running ....');
        return;
    }
    timeout = 3;
    console.log('start checkEventTobeFixed');
    runing = true;

    eventGateway.getEventTobeFixed().then((data) => {
        _.map(data, function (item) {
            matchGateway.getActiveEventAndFinishByGroupId(item.event_id).then((match) => {
                if (match) {
                    eventGateway.updateAttributes(item.event_id, {
                        time_status: 3,
                        ss: match.home_score + '-' + match.away_score,
                        hf_ss: match.ht_home_score + '-' + match.ht_away_score
                    });
                    console.log('Fixed:' + item.event_id);
                }
            });
        });
    });
};
