const request = require('request');
const _ = require('lodash');
const eventGateway = require('../gateway/eventGateway');
let cookie = 'language=vi-VN; View_Name=v1; Template_Name=aliceblue; srv=213fcba0b439040dd6fa294faa1305a2; nginx=1902487744.47873.0000; ASP.NET_SessionId=ihpol1nkr5qblbmelrajj51r; __cf_bm=xrxGhEWB0znUBygpjzC.esr0x414ELz1kE07t9d0vYk-1641374989-0-AcvF54I7WsiEVml3kJ2+2gomzwimH+I9N0w2AjcL5N1dAkeQO9L5zAQyzotpRCkUXCxaDF0ZFnUl0V9RbpQwv7IwTcWHKAmE50hor61u0xDjCbyth8rAP44G8hXXEK+zMw==; OddsTypeLocation=MY';
const HOST = 'https://mylv.fts368.com/Member/betsview/betlight/dataodds.asmx/getothercache';
let apis = 'fc=1&m_gameType=S&m_SortByTime=0&m_LeagueList=&m_market=Today';
let cacheData = null;

let services = {
    getInplay: function () {
        eventGateway.resetCorrectScore();
        return call(apis, 1);
    }
};

module.exports = services;

function call(url, status, force) {
    return auth(force).then(function (key) {
        return get(url, status).then(function (data) {
            if ((!data || !data.length) && !force) {
                return call(url, status, true);
            }
            return data;
        });
    });
}

function get(dt, status) {
    const optionsIn = {
        method: 'POST',
        url: HOST,
        gzip: true,
        body: dt,
        headers: {
            'content-type': 'application/json',
            cookie: cookie,
            Host: 'mylv.fts368.com',
            Referer: HOST
        }
    };
    return new Promise(function (resolve, reject) {
        if (cacheData && status === 0) {
            let result = convertBody2(cacheData, status);
            cacheData = null;
            resolve(result);
            return;
        }
        request(optionsIn, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                try {
                    body = JSON.parse(body);
                    if (status === 1) {
                        cacheData = body;
                    }
                    if (status === -1) {
                        resolve(convertBodyMulti(body));
                    } else {
                        resolve(convertBody2(body, status));
                    }
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
}

function auth(force) {
    return new Promise(function (resolve, reject) {
        if (!force && cookie) {
            return resolve();
        }
        request('https://mylv.fts368.com/Member/BetOdds/HdpDouble.aspx?v=1&m1=Today&sports=S_', function (err, res, body) {
            cookie = res.rawHeaders[13] + ';language=vi-VN; View_Name=v1; Template_Name=aliceblue; nginx=1734715584.20480.0000; srv=15e3a3beec1b5a7d423505db5df697bf; _ga=GA1.2.2096992775.1521815567; _gid=GA1.2.876895440.1521815567; setting_update=false; OddsTypeLocation=MY';
            resolve();
        });
    });
}

function convertBodyMulti(body) {
    let listInplay = convertBody2(body,);
    let listUp = convertBody2(body, 0);
    let ids = _.map(listInplay, item => item.odd_id);
    _.map(listUp, item => ids.push(item.odd_id));
    return ids;
}

function convertBody2(body, status) {
    
    let cache = null;
    // if (status === 1) {
    //     list = body.data;
    // }
    let cacheCornerId = null;
    let inplay = body.run.map(function (item, index) {
            return convertItem2(item, index, cache, status, cacheCornerId);
        });
    body.today
        .map(function (item, index) {
            return convertItem2(item, index, cache, status, cacheCornerId);
        });
    return inplay;
}

function convertItem2 (item, index, cache, status, cacheCornerId) {
    return eventGateway.updateAttributes(item[15],
        {
            is_cs: true,
            correct_score: {
                '1_0': parseFl(item[22], ''),
                '2_0': parseFl(item[27], ''),
                '2_1': parseFl(item[28], ''),
                '3_0': parseFl(item[32], ''),
                '3_1': parseFl(item[33], ''),
                '3_2': parseFl(item[34], ''),
                '4_0': parseFl(item[37], ''),
                '4_1': parseFl(item[38], ''),
                '4_2': parseFl(item[39], ''),
                '4_3': parseFl(item[40], ''),
                '0_0': parseFl(item[17], ''),
                '1_1': parseFl(item[23], ''),
                '2_2': parseFl(item[29], ''),
                '3_3': parseFl(item[35], ''),
                '4_4': parseFl(item[41], ''),
                'AOS': parseFl(item[42], ''),
                '0_1': parseFl(item[18], ''),
                '0_2': parseFl(item[19], ''),
                '1_2': parseFl(item[24], ''),
                '0_3': parseFl(item[20], ''),
                '1_3': parseFl(item[25], ''),
                '2_3': parseFl(item[30], ''),
                '0_4': parseFl(item[21], ''),
                '1_4': parseFl(item[26], ''),
                '2_4': parseFl(item[31], ''),
                '3_4': parseFl(item[36], '')
            }
        });
}

function parseFl(item, defaultValue) {
    if (item === -999) {
        return '';
    }
    return parseFloat(item) || parseFloat(item) === 0 ? parseFloat(item) : defaultValue;
}

