const asyncLib = require('../libs/asyncLib');
const timeService = require('../libs/timeService');
const eventGateway = require('../gateway/eventGateway');
const oddGateway = require('../gateway/oddGateway');
let runing = false;
let timeout = 3;

module.exports = function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl autoManualEvents running ....');
        return;
    }
    timeout = 3;
    console.log('start autoManualEvents');
    runing = true;
    eventGateway.getManualEvents().then(function (data) {
        return asyncLib.eachLimit(data, 2, function (event, callback) {
            run(event, callback);
        });
    }).then(function () {
        console.log('crawl checkEventEnd done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl checkEventEnd done with ', err);
        runing = false;
    });
};

function run (event, callback) {
    const minutes = timeService.formatTimeMatch(event.start_date);
    console.log(' minutes ', minutes);
    const result = {
        time_status: 0,
        can_finish: false,
        time_position: 0,
        time: event.time
    };
    if (minutes < 0) {
    } else if (minutes < 1) {
        result.hf_ss = event.ss;
        result.time = 'Live';
        result.time_status = 1;
        result.time_position = 1;
    } else if (minutes <= 46) {
        result.hf_ss = event.ss;
        result.time_status = 1;
        result.time_position = 1;
        result.time = '1H ' + (minutes - 1);
        // result.hf_ss = data.ss;
    } else if (minutes <= 49) {
        result.hf_ss = event.ss;
        result.time_status = 1;
        result.time_position = 1;
        result.time = '1H 45+' + (minutes - 46);
    } else if (minutes <= 59) {
        result.time = 'H.Time';
        result.time_status = 1;
        result.time_position = 2;
        result.hf_ss = event.ss;
        result.haft_time_at = timeService.nowUs();
    } else if (minutes <= 104) {
        result.time = '2H ' + (minutes - 59);
        result.time_status = 1;
        result.time_position = 2;
    } else if (minutes <= 104 + 3) {
        result.time = '2H 45+' + (minutes - 104);
        result.time_status = 1;
        result.time_position = 2;
    } else {
        result.time_position = 2;
        result.time_status = 3;
        result.can_finish = true;
    }

    // Clear H1 odds
    if (result.time_position === 2) {
        result.hf_hdp = {'home_od': '', 'handicap_team': 'home', 'handicap_value': '', 'handicap': '', 'away_od': ''};
        result.hf_ou = {'over_od': '', 'handicap': '', 'handicap_value': '', 'under_od': ''};
        result.hf_1x2 = {'home_od': '', 'draw_od': '', 'away_od': ''};
    }

    // result.extra = event.extra || {};
    // result.extra.ss = event.extra.ss || [];
    // result.extra.ss = result.extra.ss.concat(countScores(event.ss, result.ss));

    eventGateway.updateAttributes(event.event_id, result).then(() => {
        const update = {
            odd_status: result.time_status
        };
        if (result.time_position === 2) {
            update.hf_hdp = {'home_od': '', 'handicap_team': 'home', 'handicap_value': '', 'handicap': '', 'away_od': ''};
            update.hf_ou = {'over_od': '', 'handicap': '', 'handicap_value': '', 'under_od': ''};
            update.hf_1x2 = {'home_od': '', 'draw_od': '', 'away_od': ''};
        }
        return oddGateway.updateAttributes(event.event_id, update);
    }).then(() => callback()).catch((error) => {
        console.log('error', error);
        callback();
    });
}
