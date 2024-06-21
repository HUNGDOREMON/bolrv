const { log } = require('async');
const request = require('request');
const Cache = require('../components/Cache');
const timeService = require('../libs/timeService');

const serialize = obj => {
    const str = [];
    for (let p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
        }
    }

    return str.join('&');
};

const crawl = () => {
    return new Promise(function (resolve, reject) {
        const cookie = Cache.getCookies();
        if (!cookie) {
            return reject(new Error('cookie not ready'));
        }

        var options = {
            'method': 'POST',
            'url': 'https://mylv.fts368.com/Member/Lists/MatchResult_New.aspx',
            'headers': {
                'Cookie': 'ASP.NET_SessionId=' + cookie + '; language=vi-VN; nginx=1902487744.47873.0000'
            },
            formData: {
                'type': 'Select',
                'MarketType': '0',
                'Sport': 'S',
                'leagueId': '0',
                'DateF': timeService.nextDayInSing(0),
                'DateT': timeService.nextDayInSing(0),
                'Status': 'Normal'
            }
        };
       
        request(options, function (error, response) {
            if (error) {
                reject(error);
            } else {
                try {
                    const data = JSON.parse(response.body);
                    resolve(data);
                } catch (e) {
                    reject(response.body);
                }
            }
        });
    });
};

const getResults = () => {
    return crawl().catch(e => {
        console.log(e);
        Cache.setCookies(null);
        throw e;
    });
};

module.exports = getResults;
