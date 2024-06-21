const request = require('request');
const Cache = require('../components/Cache');
const CacheAuth = require('../components/CacheAuth');
const accounts = [
    { 'username': 'c2FiYTExMTE=', 'password': 'UXFxcTExMTE=' },
    { "username": "Y29ubWVvMjIy", "password": "UXFxcTExMTE=" },
    { "username": "Y29ubWVvMzMz", "password": "UXFxcTExMTE=" }
];
let runing = false;
let timeout = 3;

module.exports = async () => {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl getTokenSaba running ....');
        return;
    }

    runing = true;
    timeout = 3;


    const current = await CacheAuth.getTokenAuth();
    if (current !== 'null') {
        const date_ob = new Date();
        console.log('================token auth saba current================', date_ob.getHours() + ':' + date_ob.getMinutes());
        console.log('==================================================');
        console.log('================thy token auth saba existed=============', current);
        runing = false;
        return;
    }

    console.log('start getTokenSaba');
    await Login().then(token => {
        console.log('===== new token auth saba: ', token);
        return CacheAuth.setTokenAuth(token);
    })
    .catch(e => {
        console.log('===== token auth saba expired: ', token);
        return CacheAuth.setTokenAuth("null");
    })
    .finally(error => {
        console.log('finally getTokenSaba', error);
        runing = false;
    });
};
function randomIntFromInterval (min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}
const Login = () => {
    const ramdom = randomIntFromInterval(0, accounts.length - 1);
    const account = accounts[ramdom];

    console.log('================thy used saba account: ', account);

    return new Promise((resolve, reject) => {
        var options = {
            'method': 'POST',
            'url': 'https://www.qq288rr.com/api/v1/Member/Login',
            'headers': {
                'Content-Type': 'application/json',
                'Cookie': 'language=vi-VN'
                // 'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
            },
            body: JSON.stringify(account)
        };
        request(options, function (error, response) {
            if (error) {
                reject(error);
            } else {
                try {
                    let { data } = JSON.parse(response.body);
                    let token = data.token;
                    resolve(token);
                } catch (e) {
                    reject(e);
                }
            }
        });
    });
};
