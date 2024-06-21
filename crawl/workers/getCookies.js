const Cache = require('../components/Cache');
const CacheTv = require('../components/CacheTv');
const puppeteer = require('../components/puppeteer');
let runing = false;
let timeout = 3;

module.exports = async () => {
    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl getCookies running ....');
        return;
    }
    runing = true;
    timeout = 3;
    const current = Cache.getCookies();
    if (current) {
        const date_ob = new Date();
        console.log('================thyxxxx auto cronjob cookie================', date_ob.getHours() + ':' + date_ob.getMinutes());
        console.log('================thy session cookie=============', current);
        runing = false;
        return;
    }
    console.log('start getCookies');
    await puppeteer().then(cookie => {
        console.log('================thy================ new cookie', cookie);
        
        CacheTv.setCookiesMlv(cookie);
        
        return Cache.setCookies(cookie);
    }).finally(error => {
        console.log('start getCookies', error);
        runing = false;
    });
};
