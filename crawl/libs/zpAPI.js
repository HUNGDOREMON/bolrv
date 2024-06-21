const request = require('request');
const asyncLib = require('../libs/asyncLib');
const timeService = require('../libs/timeService');
const money = require('../libs/money');
const _ = require('lodash');
const cheerio = require('cheerio')
let config = require('../config');
let cookie = null;
let key = {}
let apis = {
    INPLAY: 'http://mkt.zpisportbk.com/UnderOver_data.aspx?Market=l&Sport=1&DT=&RT=W&CT=&Game=0&OrderBy=0&OddsType=4&MainLeague=0',
    UPCOMING: 'http://mkt.zpisportbk.com/UnderOver_data.aspx?Market=t&Sport=1&DT=&RT=W&CT=&Game=0&OrderBy=0&OddsType=4&DispRang=0',
}

let services = {
    getInplay: function () {
        return call(apis.INPLAY, 1);
    },
    getUpcoming: function () {
        return call(apis.UPCOMING, 0);
    },
    getSeed: _data,
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
            Host: 'mkt.zpisportbk.com',
            Referer: 'http://mkt.zpisportbk.com/UnderOver.aspx?Sport=1&Market=t&Game=0',
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
        request('http://mkt.zpisportbk.com', function (err, res, body) {
            cookie = res.rawHeaders[9];
            const optionsIn = {
                method: 'GET',
                url: 'http://mkt.zpisportbk.com/UnderOver.aspx?Sport=1&Market=t&Game=0',
                headers: {
                    cookie: cookie,
                    Host: 'mkt.zpisportbk.com',
                    Referer: 'http://mkt.zpisportbk.com/UnderOver.aspx?Sport=1&Market=t&Game=0',
                }
            };
            request(optionsIn, function (err, res, body) {
                if (err) {
                    return reject(err);
                }
                const $ = cheerio.load(body);
                key = {
                    name: $('form[name=DataForm_D]').children()[10].attribs.name,
                    value: $('form[name=DataForm_D]').children()[10].attribs.value,
                }
                resolve(key);
            })
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
            home: parseFl(item[23], 0),
            away: parseFl(item[24], 0)
        },
        'start_time': item[8] || cache && cache.start_time,
        'time': item[12] && item[12].replace('\\','') || cache && cache.time,
        'timer': {
            time: item[12] && item[12].replace('\\','') || cache && cache.timer && cache.timer.time,
            added: item[20] || cache && cache.timer && cache.timer.added
        },
        'ss': cache && cache.parent_id === item[1] ? cache.ss : item[21] + '-' + item[22],
        'ft_hdp': {
            home_od: parseFl(item[32], ''),
            handicap_team: item[34] == 'a' ? 'away' : 'home',
            handicap_value: calcHandicap(item[31]),
            handicap: item[31],
            away_od: parseFl(item[33], '')
        },
        'ft_ou': {
            over_od: parseFl(item[37], ''),
            handicap: item[36],
            handicap_value: calcHandicap(item[36]),
            under_od: parseFl(item[38], ''),
        },
        'ft_1x2': {
            home_od: item[40],
            draw_od: item[41],
            away_od: item[42],
        },
        'hf_hdp': {
            home_od: parseFl(item[45], ''),
            handicap_team: item[47] == 'a' ? 'away' : 'home',
            handicap_value: calcHandicap(item[44]),
            handicap: item[44],
            away_od: parseFl(item[46], '')
        },
        'hf_ou': {
            over_od: parseFl(item[50],''),
            handicap: item[49],
            handicap_value: calcHandicap(item[49]),
            under_od: parseFl(item[51],''),
        },
        'hf_1x2': {
            home_od: item[53],
            draw_od: item[54],
            away_od: item[55],
        }
    }
}


function _data() {
    return [ { event_id: '24568451',
    parent_id: '24568451',
    time_status: 1,
    order: 0,
    type: 'main',
    corner_type: 0,
    league_id: '728',
    league_name: 'INTERNATIONAL FRIENDLY U18',
    home: 'Belgium U18',
    away: 'Turkey U18',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: 'H.Time',
    timer: { time: 'H.Time', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: -0.8,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.68 },
    ft_ou: 
     { over_od: 0.8,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: -0.94 },
    ft_1x2: { home_od: '2.6100', draw_od: '2.4700', away_od: '3.2000' },
    hf_hdp: 
     { home_od: 0.71,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.83 },
    hf_ou: 
     { over_od: 0.94,
       handicap: '0.5',
       handicap_value: 0.5,
       under_od: 0.92 },
    hf_1x2: { home_od: '3.4000', draw_od: '1.7300', away_od: '4.4000' } },
  { event_id: '24568451_1',
    parent_id: '24568451',
    time_status: 1,
    order: 1,
    type: 'main',
    corner_type: 0,
    league_id: '728',
    league_name: 'INTERNATIONAL FRIENDLY U18',
    home: 'Belgium U18',
    away: 'Turkey U18',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: 'H.Time',
    timer: { time: 'H.Time', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: 0.75,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.87 },
    ft_ou: 
     { over_od: -0.88,
       handicap: '2.0',
       handicap_value: 2,
       under_od: 0.74 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: -0.52,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.4 },
    hf_ou: 
     { over_od: -0.7,
       handicap: '0.5-1',
       handicap_value: 0.75,
       under_od: 0.56 },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568967',
    parent_id: '24568967',
    time_status: 1,
    order: 2,
    type: 'main',
    corner_type: 0,
    league_id: '10',
    league_name: 'INTERNATIONAL FRIENDLY',
    home: 'Croatia U18',
    away: 'Wales U19',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 15\'',
    timer: { time: '2H 15\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.93,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.83 },
    ft_ou: 
     { over_od: 0.7,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: -0.94 },
    ft_1x2: { home_od: '1.1000', draw_od: '5.0000', away_od: '25.0000' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568967_1',
    parent_id: '24568967',
    time_status: 1,
    order: 3,
    type: 'main',
    corner_type: 0,
    league_id: '10',
    league_name: 'INTERNATIONAL FRIENDLY',
    home: 'Croatia U18',
    away: 'Wales U19',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 15\'',
    timer: { time: '2H 15\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.29,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.53 },
    ft_ou: 
     { over_od: -0.87,
       handicap: '2.0',
       handicap_value: 2,
       under_od: 0.63 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568502',
    parent_id: '24568502',
    time_status: 1,
    order: 4,
    type: 'main',
    corner_type: 0,
    league_id: '27',
    league_name: 'CLUB FRIENDLY',
    home: 'NV Estudiantes de Murcia CF (N)',
    away: 'Royal Antwerp',
    reds: { home: 0, away: 0 },
    start_time: '201803201059',
    time: 'H.Time',
    timer: { time: 'H.Time', added: '0' },
    ss: '0-4',
    ft_hdp: 
     { home_od: 0.96,
       handicap_team: 'away',
       handicap_value: 2,
       handicap: '2.0',
       away_od: 0.88 },
    ft_ou: 
     { over_od: 0.88,
       handicap: '6.5-7',
       handicap_value: 6.75,
       under_od: 0.94 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24560697',
    parent_id: '24560697',
    time_status: 1,
    order: 5,
    type: 'main',
    corner_type: 0,
    league_id: '66396',
    league_name: 'ITALY SERIE C',
    home: 'AS Giana Erminio',
    away: 'Olbia',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: '1H 17\'',
    timer: { time: '1H 17\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.96,
       handicap_team: 'home',
       handicap_value: 0.5,
       handicap: '0.5',
       away_od: 0.92 },
    ft_ou: 
     { over_od: -0.84,
       handicap: '3-3.5',
       handicap_value: 3.25,
       under_od: 0.7 },
    ft_1x2: { home_od: '1.2500', draw_od: '4.8500', away_od: '10.0000' },
    hf_hdp: 
     { home_od: -0.76,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.64 },
    hf_ou: 
     { over_od: -0.87,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: 0.73 },
    hf_1x2: { home_od: '1.1600', draw_od: '4.7000', away_od: '36.0000' } },
  { event_id: '24560698',
    parent_id: '24560698',
    time_status: 1,
    order: 6,
    type: 'main',
    corner_type: 0,
    league_id: '66396',
    league_name: 'ITALY SERIE C',
    home: 'US Gavorrano',
    away: 'Monza',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: '1H 22\'',
    timer: { time: '1H 22\'', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: -0.74,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.62 },
    ft_ou: 
     { over_od: -0.78,
       handicap: '1.5',
       handicap_value: 1.5,
       under_od: 0.64 },
    ft_1x2: { home_od: '2.9500', draw_od: '2.1500', away_od: '3.3500' },
    hf_hdp: 
     { home_od: 0.75,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.87 },
    hf_ou: 
     { over_od: -0.6,
       handicap: '0.5',
       handicap_value: 0.5,
       under_od: 0.46 },
    hf_1x2: { home_od: '4.9500', draw_od: '1.3600', away_od: '6.2000' } },
  { event_id: '24552644',
    parent_id: '24552644',
    time_status: 1,
    order: 7,
    type: 'main',
    corner_type: 0,
    league_id: '143',
    league_name: 'GERMANY REGIONAL LEAGUE NORTH',
    home: 'SC Weiche Flensburg 08',
    away: 'Eintracht Braunschweig AM',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: '1H 17\'',
    timer: { time: '1H 17\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.94,
       handicap_team: 'home',
       handicap_value: 0.75,
       handicap: '0.5-1',
       away_od: 0.9 },
    ft_ou: 
     { over_od: -0.95,
       handicap: '3-3.5',
       handicap_value: 3.25,
       under_od: 0.77 },
    ft_1x2: { home_od: '1.1400', draw_od: '6.4000', away_od: '12.0000' },
    hf_hdp: 
     { home_od: 0.98,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.86 },
    hf_ou: 
     { over_od: 0.74,
       handicap: '1.5',
       handicap_value: 1.5,
       under_od: -0.92 },
    hf_1x2: { home_od: '1.1000', draw_od: '5.3000', away_od: '45.0000' } },
  { event_id: '24568143',
    parent_id: '24568143',
    time_status: 1,
    order: 8,
    type: 'main',
    corner_type: 0,
    league_id: '42436',
    league_name: 'SCOTLAND DEVELOPMENT LEAGUE',
    home: 'Saint Johnstone FC U20',
    away: 'Motherwell U20',
    reds: { home: 0, away: 0 },
    start_time: '201803200959',
    time: '2H 44\'',
    timer: { time: '2H 44\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.39,
       handicap_team: 'away',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: -0.55 },
    ft_ou: 
     { over_od: -0.4,
       handicap: '1.5',
       handicap_value: 1.5,
       under_od: 0.22 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24566324',
    parent_id: '24566324',
    time_status: 1,
    order: 9,
    type: 'main',
    corner_type: 0,
    league_id: '10847',
    league_name: 'CROATIA 2ND DIVISION',
    home: 'HNK Gorica',
    away: 'NK Sesvete',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 17\'',
    timer: { time: '2H 17\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: 0.8,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.96 },
    ft_ou: 
     { over_od: 0.99,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: 0.83 },
    ft_1x2: { home_od: '1.2700', draw_od: '3.6500', away_od: '19.0000' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24566324_1',
    parent_id: '24566324',
    time_status: 1,
    order: 10,
    type: 'main',
    corner_type: 0,
    league_id: '10847',
    league_name: 'CROATIA 2ND DIVISION',
    home: 'HNK Gorica',
    away: 'NK Sesvete',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 17\'',
    timer: { time: '2H 17\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: -0.71,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.55 },
    ft_ou: 
     { over_od: 0.64,
       handicap: '1.5',
       handicap_value: 1.5,
       under_od: -0.82 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24566325',
    parent_id: '24566325',
    time_status: 1,
    order: 11,
    type: 'main',
    corner_type: 0,
    league_id: '10847',
    league_name: 'CROATIA 2ND DIVISION',
    home: 'NK Lucko',
    away: 'NK Dinamo Zagreb 2',
    reds: { home: 1, away: 0 },
    start_time: '201803201029',
    time: '2H 20\'',
    timer: { time: '2H 20\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: -0.93,
       handicap_team: 'away',
       handicap_value: 0.75,
       handicap: '0.5-1',
       away_od: 0.77 },
    ft_ou: 
     { over_od: 0.99,
       handicap: '2-2.5',
       handicap_value: 2.25,
       under_od: 0.83 },
    ft_1x2: { home_od: '2.3500', draw_od: '2.4400', away_od: '3.5000' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24566325_1',
    parent_id: '24566325',
    time_status: 1,
    order: 12,
    type: 'main',
    corner_type: 0,
    league_id: '10847',
    league_name: 'CROATIA 2ND DIVISION',
    home: 'NK Lucko',
    away: 'NK Dinamo Zagreb 2',
    reds: { home: 1, away: 0 },
    start_time: '201803201029',
    time: '2H 20\'',
    timer: { time: '2H 20\'', added: '0' },
    ss: '1-0',
    ft_hdp: 
     { home_od: -0.74,
       handicap_team: 'away',
       handicap_value: 0.5,
       handicap: '0.5',
       away_od: 0.58 },
    ft_ou: 
     { over_od: 0.64,
       handicap: '2.0',
       handicap_value: 2,
       under_od: -0.82 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568005',
    parent_id: '24568005',
    time_status: 1,
    order: 13,
    type: 'main',
    corner_type: 0,
    league_id: '71086',
    league_name: 'QATAR LEAGUE U23',
    home: 'Al Gharrafa U23',
    away: 'Al Arabi (QAT) U23',
    reds: { home: 0, away: 0 },
    start_time: '201803200959',
    time: '2H 45\'',
    timer: { time: '2H 45\'', added: '4' },
    ss: '1-3',
    ft_hdp: 
     { home_od: 0.59,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.75 },
    ft_ou: 
     { over_od: -0.41,
       handicap: '4.5',
       handicap_value: 4.5,
       under_od: 0.23 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568005_1',
    parent_id: '24568005',
    time_status: 1,
    order: 14,
    type: 'main',
    corner_type: 0,
    league_id: '71086',
    league_name: 'QATAR LEAGUE U23',
    home: 'Al Gharrafa U23',
    away: 'Al Arabi (QAT) U23',
    reds: { home: 0, away: 0 },
    start_time: '201803200959',
    time: '2H 45\'',
    timer: { time: '2H 45\'', added: '4' },
    ss: '1-3',
    ft_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    ft_ou: 
     { over_od: -0.24,
       handicap: '4.5-5',
       handicap_value: 4.75,
       under_od: 0.06 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568006',
    parent_id: '24568006',
    time_status: 1,
    order: 15,
    type: 'main',
    corner_type: 0,
    league_id: '71086',
    league_name: 'QATAR LEAGUE U23',
    home: 'Qatar SC U23',
    away: 'Al Kharaitiyat U23',
    reds: { home: 0, away: 0 },
    start_time: '201803201059',
    time: 'H.Time',
    timer: { time: 'H.Time', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: 0.87,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.97 },
    ft_ou: 
     { over_od: 0.81,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: -0.99 },
    ft_1x2: { home_od: '2.1100', draw_od: '2.9400', away_od: '3.2500' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568006_1',
    parent_id: '24568006',
    time_status: 1,
    order: 16,
    type: 'main',
    corner_type: 0,
    league_id: '71086',
    league_name: 'QATAR LEAGUE U23',
    home: 'Qatar SC U23',
    away: 'Al Kharaitiyat U23',
    reds: { home: 0, away: 0 },
    start_time: '201803201059',
    time: 'H.Time',
    timer: { time: 'H.Time', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: -0.9,
       handicap_team: 'home',
       handicap_value: 0.5,
       handicap: '0.5',
       away_od: 0.74 },
    ft_ou: 
     { over_od: 0.68,
       handicap: '1.5',
       handicap_value: 1.5,
       under_od: -0.86 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568075',
    parent_id: '24568075',
    time_status: 1,
    order: 17,
    type: 'main',
    corner_type: 0,
    league_id: '50645',
    league_name: 'CROATIA 3RD DIVISION',
    home: 'NK Udarnik Kurilovec',
    away: 'HNK Segesta',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 19\'',
    timer: { time: '2H 19\'', added: '0' },
    ss: '1-1',
    ft_hdp: 
     { home_od: 0.74,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: -0.94 },
    ft_ou: 
     { over_od: 0.87,
       handicap: '3.0',
       handicap_value: 3,
       under_od: 0.91 },
    ft_1x2: { home_od: '2.2000', draw_od: '2.1400', away_od: '5.1000' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568075_1',
    parent_id: '24568075',
    time_status: 1,
    order: 18,
    type: 'main',
    corner_type: 0,
    league_id: '50645',
    league_name: 'CROATIA 3RD DIVISION',
    home: 'NK Udarnik Kurilovec',
    away: 'HNK Segesta',
    reds: { home: 0, away: 0 },
    start_time: '201803201029',
    time: '2H 19\'',
    timer: { time: '2H 19\'', added: '0' },
    ss: '1-1',
    ft_hdp: 
     { home_od: -0.83,
       handicap_team: 'home',
       handicap_value: 0.5,
       handicap: '0.5',
       away_od: 0.63 },
    ft_ou: 
     { over_od: 0.55,
       handicap: '2.5-3',
       handicap_value: 2.75,
       under_od: -0.77 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: '',
       handicap_team: 'home',
       handicap_value: NaN,
       handicap: '',
       away_od: '' },
    hf_ou: { over_od: '', handicap: '', handicap_value: NaN, under_od: '' },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } },
  { event_id: '24568081',
    parent_id: '24568081',
    time_status: 1,
    order: 19,
    type: 'main',
    corner_type: 0,
    league_id: '50645',
    league_name: 'CROATIA 3RD DIVISION',
    home: 'NK Rudar Labin',
    away: 'NK Pazinka Pazin',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: '1H 21\'',
    timer: { time: '1H 21\'', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: 0.93,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.87 },
    ft_ou: 
     { over_od: 0.92,
       handicap: '1.5-2',
       handicap_value: 1.75,
       under_od: 0.86 },
    ft_1x2: { home_od: '2.2500', draw_od: '2.6400', away_od: '3.3500' },
    hf_hdp: 
     { home_od: 0.46,
       handicap_team: 'home',
       handicap_value: 0,
       handicap: '0.0',
       away_od: -0.66 },
    hf_ou: 
     { over_od: -0.95,
       handicap: '0.5',
       handicap_value: 0.5,
       under_od: 0.73 },
    hf_1x2: { home_od: '3.3000', draw_od: '1.5600', away_od: '5.7000' } },
  { event_id: '24568081_1',
    parent_id: '24568081',
    time_status: 1,
    order: 20,
    type: 'main',
    corner_type: 0,
    league_id: '50645',
    league_name: 'CROATIA 3RD DIVISION',
    home: 'NK Rudar Labin',
    away: 'NK Pazinka Pazin',
    reds: { home: 0, away: 0 },
    start_time: '201803201129',
    time: '1H 21\'',
    timer: { time: '1H 21\'', added: '0' },
    ss: '0-0',
    ft_hdp: 
     { home_od: -0.8,
       handicap_team: 'home',
       handicap_value: 0.5,
       handicap: '0.5',
       away_od: 0.6 },
    ft_ou: 
     { over_od: -0.86,
       handicap: '2.0',
       handicap_value: 2,
       under_od: 0.64 },
    ft_1x2: { home_od: '', draw_od: '', away_od: '' },
    hf_hdp: 
     { home_od: -0.64,
       handicap_team: 'home',
       handicap_value: 0.25,
       handicap: '0-0.5',
       away_od: 0.44 },
    hf_ou: 
     { over_od: -0.69,
       handicap: '0.5-1',
       handicap_value: 0.75,
       under_od: 0.47 },
    hf_1x2: { home_od: '', draw_od: '', away_od: '' } } ];
}