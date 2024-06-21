const request = require('request');
const Cache = require('../components/Cache');
const CacheAuth = require('../components/CacheAuth');
const CacheToken = require('../components/CacheToken');

let runing = false;
let timeout = 3;

module.exports = async () => {
    if (global.maintain) {
        return;
    }

    const tokenAuth = await CacheAuth.getTokenAuth();
    if (tokenAuth === "null") {
        console.log('Not login');
        runing = false;
        return;
    }

    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl getTokenDataSaba running ....');
        return;
    }

    runing = true;
    timeout = 3;
    console.log('start getTokenDataSaba');

    const current = await CacheToken.getTokenData();
    if (current !== 'null') {
        const date_ob = new Date();
        console.log('================token data saba current================', date_ob.getHours() + ':' + date_ob.getMinutes());
        console.log('==================================================');
        console.log('================thy token data saba existed=============', current);
        runing = false;
        return;
    }

    await getTokenData(tokenAuth).then(token => {
        console.log('===== new token data saba', token);
        return CacheToken.setTokenData(token);
    }).catch(e => {
        console.log('===== new token data saba error');
        CacheAuth.setTokenAuth("null");
        return CacheToken.setTokenData("null");
    })
    .finally(error => {
        console.log('start getTokenData', error);
        runing = false;
    });
};

const getTokenData = (token) => {
    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'proxy': 'http://VN97489:FI54qzt@103.89.88.124:56788',
            'url': 'https://www.qq288rr.com/api/v1/GamePage/GameUrl',
            'headers': {
                'Content-Type': 'application/json',
                'Cookie': 'language=vi-VN',
                'authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                'providerId': 'ICL'
            })

        };
        request(options, function (error, response) {

            if (error) {
                reject(error);
            } else {
                try {
                    let { data } = JSON.parse(response.body);
                    let url = data.gameInfo.gameUrl.replace('lang=en', 'lang=vn');
                    request({
                        'method': 'GET',
                        'url': url,
                        'proxy': 'http://VN97489:FI54qzt@103.89.88.124:56788'
                    }, function (error, response) {
                        if (error) {
                            reject(error);
                        } else {
                            let t = response.body.split('var _OddsServerToken = \'');
                            // let url = response.request.uri.href.split('/Depositlogin')[0];
                            t = t[1].split('var _EnableEuroCupOddsBoostBanner = (0 == 1);');
                            let tokenAD = t[0].replace('\';', '').trim();
                            resolve(tokenAD);
                        }
                    });
                } catch (e) {
                    reject(response.body);
                }
            }
        });
    });
};
