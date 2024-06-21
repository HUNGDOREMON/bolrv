const request = require('request');
const asyncLib = require('../libs/asyncLib');
const timeService = require('../libs/timeService');
const money = require('../libs/money');
const _ = require('lodash');
const cheerio = require('cheerio')
let config = require('../config');
let cookie = null;
let key = {}
let host = 'http://soccer.365bong.com';
//let host = 'http://mkt.zpisportbk.com';
let apis = {
    INPLAY: host+'/UnderOver_data.aspx?Market=l&Sport=1&DT=&RT=W&CT=&Game=0&OrderBy=0&OddsType=4&MainLeague=0',
    UPCOMING: host+'/UnderOver_data.aspx?Market=t&Sport=1&DT=&RT=W&CT=&Game=0&OrderBy=0&OddsType=4&DispRang=0',
}

let services = {
    getInplay: function () {
        return call(apis.INPLAY, 1);
    },
    getUpcoming: function () {
        return call(apis.UPCOMING, 0);
    }
}

module.exports = services;

function call(url, status, force) {
    return auth(force).then(function (key) {
        return get(url, status).then(function (data) {
            if ((!data || !data.length) && !force) {
                return call(url, status, true);
            }
            return data;
        })
    })
}

function get(url, status) {
    const optionsIn = {
        method: 'GET',
        url: url+`&${key.name}=${key.value}&_=${timeService.currentTimestamp()}`,
        headers: {
            cookie: cookie,
            Host: 'soccer.365bong.com',
            Referer: host+'/UnderOver.aspx?Sport=1&Market=t&Game=0',
        }
    };
    return new Promise(function (resolve, reject) {
        request(optionsIn, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                // console.log(body);
                resolve(convertBody(body, status));    
            }
        });
    });
}

function auth(force) {
    return new Promise(function (resolve, reject) {
        if (!force && cookie && key) {
            return resolve(key);
        }
        request(host, function (err, res, body) {
            cookie = res.rawHeaders[7];
            const optionsIn = {
                method: 'GET',
                url: host+'/UnderOver.aspx?Sport=1&Market=t&Game=0',
                headers: {
                    cookie: cookie,
                    Host: 'soccer.365bong.com',
                    Referer: host+'/UnderOver.aspx?Sport=1&Market=t&Game=0',
                }
            };
            resolve(key);
        })
    })
}

function convertBody(body, status) {
    let list = /(?=\[')([^;]*?)(\])/g.exec(body);
    if (!list) {
        return [];
    }
    let NN = [];
    do {
        var item = list[0].replace("['", "").replace("']", "");
        NN[NN.length] = item.split("','");
        body = body.replace(list[0], '');
        list = /(?=\[')([^;]*?)(\])/g.exec(body);
    } while (list)
    let cache = null;
    let cacheCornerId = null;
    return NN.map(function (item, index) {
        cache = convertItem(item, cache, index, status, cacheCornerId);
        if (cache.type == 'no_of_corners') {
            cacheCornerId = cache.event_id;
        }
        return cache; 
    }).filter(function (item) {
        if (!item.league_name || item.league_name == "FANTASY MATCH") {
            return false;
        }
        var list = item.league_name ? item.league_name.split(' - ') : [];
        if (list.length >= 2 && list[1] !== 'CORNERS') {
            return false;
        }
        if (item.home.indexOf('Home Team') > -1 && item.away.indexOf('Away Team') > -1) {
            return false;
        }
        return true;
    });
}

function parseFl(item, defaultValue) {
    return parseFloat(item) || defaultValue;
}

function getType(league_name, home, away) {
    if (league_name.indexOf('- CORNERS') > -1) {
        if (home.indexOf('No.of Corners') > -1 && away.indexOf('No.of Corners') > -1) {
            return {
                type: 'no_of_corners'
            }
        } else {
            let kinds = /(\d+)([A-z]{2} )(Corner)/g.exec(home);
            if (kinds.length) {
                return {
                    corner_type: kinds[1],
                    type: 'conner'
                }
            } else return {
                type: 'other'
            }
        }
    }
    return {
        type: 'main'
    };
}

function calcHandicap(value) {
    let str = value.split('-');
    if (str.length == 0) {
        return '';
    }
    if (str.length == 1) {
        return parseFloat(str[0]);
    }
    return money.div(money.add(str[1], str[0]), 2);
}

function convertItem(item, cache, index, status, cacheCornerId) {
    if (index == 0) {
        console.log(item);
        console.log(item[31]);

    }
    var league_name = item[5] || cache && cache.league_name;
    var home = item[6] || cache && cache.home;
    var away = item[7] || cache && cache.away;
    var dataType = getType(league_name, home, away);
    return {
        'event_id': cache && cache.parent_id === item[1] ? cache.event_id +'_1' : item[1],
        'parent_id': dataType.type == 'conner' ? cacheCornerId : item[1],
        'time_status': status,
        'order': index,
        'type': dataType.type,
        'corner_type': dataType.corner_type || 0,
        'league_id': item[4] || cache && cache.league_id,
        'league_name': league_name,
        'home': home,
        'away': away,
        'reds': {
            home: parseFl(item[22], 0),
            away: parseFl(item[23], 0)
        },
        'start_time': item[8] || cache && cache.start_time,
        'time': item[12] && item[12].replace('\\','') || cache && cache.time,
        'timer': {
            time: item[12] && item[12].replace('\\','') || cache && cache.timer && cache.timer.time,
            added: item[20] || cache && cache.timer && cache.timer.added
        },
        'ss': cache && cache.parent_id === item[1] ? cache.ss : item[19] + '-' + item[20],
        'ft_hdp': {
            home_od: parseFl(item[26], ''),
            handicap_team: item[28] == 'a' ? 'away' : 'home',
            handicap_value: calcHandicap(item[25]),
            handicap: item[25],
            away_od: parseFl(item[27], '')
        },
        'ft_ou': {
            over_od: parseFl(item[31], ''),
            handicap: item[30],
            handicap_value: calcHandicap(item[30]),
            under_od: parseFl(item[32], ''),
        },
        'ft_1x2': {
            home_od: item[34],
            draw_od: item[35],
            away_od: item[36],
        },
        'hf_hdp': {
            home_od: parseFl(item[39], ''),
            handicap_team: item[41] == 'a' ? 'away' : 'home',
            handicap_value: calcHandicap(item[38]),
            handicap: item[38],
            away_od: parseFl(item[40], '')
        },
        'hf_ou': {
            over_od: parseFl(item[44],''),
            handicap: item[43],
            handicap_value: calcHandicap(item[43]),
            under_od: parseFl(item[45],''),
        },
        'hf_1x2': {
            home_od: item[47],
            draw_od: item[48],
            away_od: 0,
        }
    }
}