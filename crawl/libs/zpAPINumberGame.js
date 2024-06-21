const request = require('request');
const asyncLib = require('../libs/asyncLib');
const timeService = require('../libs/timeService');
const money = require('../libs/money');
const _ = require('lodash');
const cheerio = require('cheerio')
let config = require('../config');
let cookie = 'OddsType_SPONUUS01445=2; domain=zpisportbk.com; expires=Wed, 14-Oct-2020 02:03:25 GMT; path=/';
let key = {}
let apis = {
    INPLAY: 'http://sb.zpisportbk.com/Bingo_data.aspx?Sport=161&Market=l&DT=%7B%7Br_dt%7D%7D&RT=W&CT=&Game=0&OddsType=4'
}

let services = {
    getInplay: function () {
        return call(apis.INPLAY, 1);
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
    console.log(timeService.currentTimestamp());
    const optionsIn = {
        method: 'GET',
        url: url+`&_=${timeService.currentTimestamp() * 1000}`,
        headers: {
            cookie: '__cfduid=de05bbad3e8aac903d4d37f615d6b6fad1532526540; _ga=GA1.2.631127926.1532526541; __zlcmid=nZhW68Gb3TDLQb; OddsType_=3; KeepOdds-29304745=no; Wel_SPONUUS01445_spondemo$DefAccount01=1; QBHint_SPONUUS01445=1; MSPlatform=2; DispVer=3; MiniKey=max; IsBDLogin=false; ASP.NET_SessionId=yg1xm4pj1nk4a1fmfe5iow5v; setCurrMainTab_368Cash=Tab02; setShowMainTab_368Cash=Tab02; show-promote-new-version=yes; OddsType_368CashINH0110115=4; setSportsTab=Tab02; setLastSportType=act%3Dsports; switchViewSkinType_368Cash=0; _gid=GA1.2.1890790394.1547341467; dct=78898343d02d0829cdda0067c155681a; OddsType_SPONUUS01445=3; LangKey=vn; g=002d0878d55041b8afbfe987e33c09a5; lip=wrrCtcKUwoTDhcObwovCmsKrw7HDj8K9G8KBwo/DssK4ZQVEw5jCnMOpw63Dt00FK1PCoErCuRc4YsKsw4fDlmoDw4fCqELDkRByIcOLNsOlw4ctdsO1w7XCo8K8CcKKw4DDgT4=',
            Host: 'sb.zpisportbk.com',
            Referer: 'http://sb.zpisportbk.com/Bingo.aspx?Sport=161&Market=t&DispVer=3',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
        }
    };
    return new Promise(function (resolve, reject) {
        request(optionsIn, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(convertBody(body, status));    
            }
        });
    });
}

function auth(force) {
    return new Promise(function (resolve, reject) {
        if (!force && cookie && key || true) {
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
                console.log(body);
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
    return NN.map(function (item, index) {
        return convertItem(item);
    }).filter(function (item) {
        return true;
    });
}

function getBallNumbers(item1, item2) {
    if (item2 == 0) {
        return []
    }
    if (item2 == item1) {
        return [parseInt(item1)]
    }
    return [parseInt(item1), parseInt(item2)]
}

function convertItem(item) {
    return {
        'event_id': `${item[2]}${item[1]}`,
        'code': item[2].replace(item[4], ''),
        'name': item[5],
        'type': item[5] == 'Turbo Number Game' ? 'turbo' : 'number',
        'data': item,
        'last_ball': item[19],
        'step': parseInt(item[21]) + parseInt(item[22]),
        // 'date': timeService.formatDateTime(item[8]),
        'ball_numbers': getBallNumbers(item[26], item[19])
    }
}