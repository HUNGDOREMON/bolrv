const getResults = require('../libs/getResults');
const matchGateway = require('../gateway/matchGateway');
let runing = false;
let timeout = 3;

module.exports = function () {

    if (global.maintain) {
        return;
    }
    if (runing && timeout !== 0) {
        timeout--;
        console.log('crawl crawlResult running ....');
        return;
    }
    timeout = 3;
    console.log('start crawlResult');
    runing = true;

    getResults().then(function (data) {
        console.log('Crawl result count ', data.length);
        return matchGateway.saveALl(data);
    }).then(function () {
        console.log('crawl crawlResult done');
        runing = false;
    }).catch(function (err) {
        console.log('crawl crawlResult done with ', err);
        runing = false;
    });
}