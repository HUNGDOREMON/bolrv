const request = require('request');
const asyncLib = require('../libs/asyncLib');
const _ = require('lodash');
var config = require('../config');
var LIMIT = 10;

const apis = {
    INPLAY: config.APP_API + '/v1/events/inplay',
    UPCOMING: config.APP_API + '/v1/events/upcoming',
    VIEW: config.APP_API + '/v1/event/view',
    ODDS: config.APP_API + '/v1/event/odds',
}

const TOKEN = config.APP_API_TOKEN;


let services = {
    getInplay: function (page = 1) {
        return get(apis.INPLAY + `?sport_id=1&token=${TOKEN}&page=${page}`);
    },
    getUpcoming: function (day, page = 1) {
        return get(apis.UPCOMING + `?sport_id=1&token=${TOKEN}&day=${day}&page=${page}`);  
    },
    getView: function (event_ids) {
        return get(apis.VIEW + `?token=${TOKEN}&event_id=${event_ids.toString()}`);  
    },
    getViewByIds: function (event_ids) {
        let data = {
            success: 1,
            results: []
        };
        let page = 1;
        return asyncLib.whilst(
            function () { return !!page; },
            function (cb) {
                let value = slitIds(page, event_ids);
                page = value.next_page;
                services.getView(value.ids).then(function (res) {
                    data.results = data.results.concat(res.results);
                    cb();
                }).catch(function (err) {
                    cb()
                })
            }
        ).then(function () {
            return data;
        });
    },
    getOdds: function (event_id, since_time = 0) {
        return get(apis.ODDS + `?token=${TOKEN}&event_id=${event_id}&since_time=${since_time}&source=${config.APP_API_SOURCE}`);
    }
}

module.exports = services;

function slitIds(page, ids) {
    var list = ids.slice((page - 1) * LIMIT, page  * LIMIT);
    page++;
    return {
        next_page: ids.slice((page - 1) * LIMIT, page  * LIMIT).length ? page : null,
        ids: list
    }
}

function get(url) {
    count ++;
    if (count % 1000 === 0) {
        console.log('Request: ', count);
    }
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                try{
                    var value = JSON.parse(body);
                    if (value.success == 1) {
                        resolve(value);
                    } else {
                        console.log(url);
                        reject(value.error);
                    }
                } catch(e) {
                    console.log(url);
                    console.log(e);
                    reject(e);
                }
            }
        });
    });
}