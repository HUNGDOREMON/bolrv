const request = require('request');
const timeService = require('../libs/timeService');
const money = require('../libs/money');
const _ = require('lodash');
const ProxyList = require('free-proxy');
const proxyList = new ProxyList();

let cookie = 'ASP.NET_SessionId=je533e3grd23lg2ewsp0jv3f; language=vi-VN; View_Name=v1; Template_Name=aliceblue; nginx=1734715584.20480.0000; _ga=GA1.2.649948699.1521811433; _gid=GA1.2.229272924.1521811433; srv=3a86681f6e40936d7f6b49e783e6c24a; OddsTypeLocation=MY; setting_update=false; ZI_TW=307381; zi=gd001100034a; dgd001100034a=636574120219558211; DefaultOddsType=MY;';
const HOST = 'https://mylv.fts368.com/Member/BetsView/BetLight/DataOdds.ashx';
let apis = {
    INPLAY: 'fc=1&m_accType=MY&SystemLanguage=vi-VN&TimeFilter=0&m_gameType=S_&m_SortByTime=0&m_LeagueList=&SingleDouble=double&clientTime=&c=A&fav=&exlist=0&keywords=&m_sp=0',
    UPCOMING: 'fc=1&m_accType=MY&SystemLanguage=vi-VN&TimeFilter=0&m_gameType=S_&m_SortByTime=0&m_LeagueList=&SingleDouble=double&clientTime=&c=A&fav=&exlist=0&keywords=&m_sp=0',
    PARLAY: 'fc=14&SystemLanguage=vi-VN&TimeFilter=0&m_SortByTime=0&m_LeagueList=&clientTime=&c=A&exlist=0&m_sp=0&m_gameType=S_&incEarly=1&incParOther=1'
};
let cacheData = null;

let services = {
    getInplay: function () {
        return call(apis.INPLAY, 1);
    },
    getUpcoming: function () {
        return call(apis.UPCOMING, 0);
    },
    getMultiEvents: function () {
        return call(apis.PARLAY, -1);
    },
    checkMaintain: function () {
        return _checkMaintain();
    }
};

module.exports = services;

function _checkMaintain() {
    return new Promise(function (resolve, reject) {
        let url = 'https://qq288rr.com/vi-VN/GamePage?Provider=CDL&RealMoney=True';
        //proxyList.random()
         //   .then(function (data) {
                request(url, function (error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(response && response.req && response.req.path && response.req.path.indexOf('MaintenanceProvider') == -1);
                    }
                });
           // })
           // .catch(function (error) {
           //     throw new Error(error);
           // });

    });
}

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
    let listInplay = convertBody2(body, 1);
    let listUp = convertBody2(body, 0);
  
    let ids = _.map(listInplay, item => item.odd_id);
    _.map(listUp, item => ids.push(item.odd_id));
    return ids;
}

function convertBody2(body, status) {
    let cache = null;
    let list = body.today;
    if (status === 1) {
        list = body.data;
    }
    let cacheCornerId = null;    
    let inplay = list
        .filter(function (item, index) {
            return item.length === 89;
        }).map(function (item, index) {
            return convertItem2(item, index, cache, status, cacheCornerId);
        });
    return inplay;
}

function formatTime(time, status, live, date) {
    if (time === 'HT') {
        return 'H.Time';
    }
    if (status === 0) {
        live = live && live.toUpperCase() || '';
        let val = timeService.convert24to12(time);
        if (date !== timeService.getTodayDate()) {
            live = date;
        }
        return `<font color="red">${live}</font> ${val}`;
    }
    return time;
}

function convertItem2(item, index, cache, status, cacheCornerId) {
   
    var league_name = item[37];
    var home = item[38];
    var away = item[39];
    var dataType = getType(league_name, home, away);
    var league_id = item[5];
    return {
        'event_id': item[34],
        'odd_id': String(item[0]),
        'parent_id': item[34],
        'live_id': item[61],
        'time_status': status,
        'order': index,
        'type': dataType.type,
        'corner_type': dataType.corner_type || 0,
        'league_id': league_id,
        'league_name': item[37],
        'event_type': item[60],
        'home': item[38],
        'away': item[39],
        'reds': {
            home: parseFl(item[28], 0),
            away: parseFl(item[29], 0)
        },
        'start_time': item[8] || cache && cache.start_time,
        'time': formatTime(item[53], status, item[52], item[56]),
        'timer': {
            time: formatTime(item[53], status, item[52], item[56]),
            added: 0,
            date: item[56],
            live: item[52]
        },
        'ss': item[7] + '-' + item[8],
        'ft_hdp': {
            home_od: parseFl(item[40], ''),
            handicap_team: item[24] == 1 ? 'home' : 'away',
            handicap_value: parseFl(item[10], ''),
            handicap: calcHandicap(parseFl(item[10], '')),
            away_od: parseFl(item[41], '')
        },
        'ft_ou': {
            over_od: parseFl(item[42], ''),
            handicap: calcHandicap(parseFl(item[12], '')),
            handicap_value: parseFl(item[12], ''),
            under_od: parseFl(item[43], '')
        },
        'ft_1x2': {
            home_od: parseFl(item[17], ''),
            draw_od: parseFl(item[19], ''),
            away_od: parseFl(item[18], '')
        },
        'hf_hdp': {
            home_od: parseFl(item[44], ''),
            handicap_team: item[64] == 1 ? 'home' : 'away',
            handicap_value: parseFl(item[14], ''),
            handicap: calcHandicap(parseFl(item[14], '')),
            away_od: parseFl(item[45], '')
        },
        'hf_ou': {
            over_od: parseFl(item[46], ''),
            handicap: calcHandicap(parseFl(item[16], '')),
            handicap_value: parseFl(item[16], ''),
            under_od: parseFl(item[47], '')
        },
        'hf_1x2': {
            home_od: parseFl(item[20], ''),
            draw_od: parseFl(item[22], ''),
            away_od: parseFl(item[21], '')
        },
        'early': false
    };
}

function parseFl(item, defaultValue) {
    if (item === -999) {
        return '';
    }
    return parseFloat(item) || parseFloat(item) === 0 ? parseFloat(item) : defaultValue;
}

function getType(league_name, home, away) {
    if (league_name.indexOf('- CORNERS') > -1) {
        if (home.indexOf('No. of Corners') > -1 && away.indexOf('No. of Corners') > -1) {
            return {
                type: 'no_of_corners'
            };
        } else {
            let kinds = /(\d+)([A-z]{2} )(Corner)/g.exec(home);
            if (kinds && kinds.length) {
                return {
                    corner_type: kinds[1],
                    type: 'conner'
                };
            } else {
                return {
                    type: 'other'
                };
            }
        }
    }
    return {
        type: 'main'
    };
}

function calcHandicap(value) {
    if (!value || value === '') {
        return value;
    }
    value = parseFloat(value);
    let key = parseInt(money.mul(value, 10));
    let neVal = parseInt(money.div(key, 10));
    if (key % 5 === 0) {
        if (Number.isInteger(value)) {
            return value + '.0';
        }
        return String(value);
    }
    if (key % 2 === 0) {
        return neVal + '-' + (neVal + 0.5);
    }
    return (neVal + 0.5) + '-' + (neVal + 1);
}
