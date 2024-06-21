const zpAPI = require('../libs/zpAPIV2');
const Cache = require('../components/Cache');
let runing = false;
let timeout = 3;

module.exports = async function () {
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl checkMaintain running ....');
        return;
    }
    timeout = 3;
    console.log('start checkMaintain');
    runing = true;
    return zpAPI.checkMaintain().then(function (data) {
        console.log('maintain', !data);
        return Cache.setMaintainMode(!data);
    }).then(function () {
        console.log('crawl checkMaintain done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl checkMaintain done with ', err);
        runing = false;
    });
};
