const CronJob = require('cron').CronJob;
const crawlInplayEventsUpdate = require('./crawlInplayEventsUpdate');
const crawlUpcomingEventsUpdate = require('./crawlUpcomingEventsUpdate');
// const crawlUpcomingEventsEUpdate = require('./crawlUpcomingEventsEUpdate');
const checkEventEndv2 = require('./checkEventEndv2');
const fixMatchResults = require('./fixMatchResults');
const checkEventCSEnd = require('./checkEventCSEnd');
const crawlMultiEventsUpdate = require('./crawlMultiEventsUpdate');
const resetWallet = require('./resetWallet');
const checkEventRefund = require('./checkEventRefundv2');
const checkMaintain = require('./checkMaintain');
const crawlNumberGame = require('./crawlNumberGame');
const crawlFinishGame = require('./crawlFinishGame');
const crawlEndGameBet = require('./crawlEndGameBet');
const autoManualEvents = require('./autoManualEvents');
const getCookies = require('./getCookies');
const crawlResultData = require('./crawlResultData');
const checkEventTobeFixed = require('./checkEventTobeFixed');


const getTokenAuthSaba = require('./getTokenAuthSaba');
const getTokenDataSaba = require('./getTokenDataSaba');
const getInplayEventSaba = require('./getInplayEventSaba');
const getUpcomingEventSaba = require('./getUpcomingEventSaba');
let jobs = [];

module.exports = {
    run: function () {
        console.log('Setup Jobs');
        // autoManualEvents();
        // checkEventRefund();
        // checkEventEndv2();
        // checkEventCSEnd();
        // crawlInplayEventsUpdate();
        // crawlUpcomingEventsUpdate();
        // checkEventTobeFixed();
        // // crawlUpcomingEventsEUpdate();
        // crawlMultiEventsUpdate();
        // checkMaintain().then(getCookies).then(crawlResultData);
        checkMaintain()
            .then(getCookies)
         //   .then(crawlResultData)
            .then(checkEventRefund)
            .then(checkEventEndv2)
            .then(checkEventCSEnd)
            .then(crawlInplayEventsUpdate)
            .then(crawlUpcomingEventsUpdate)
            .then(checkEventTobeFixed)
            .then(crawlMultiEventsUpdate)
            .then(getTokenAuthSaba)
            .then(getTokenDataSaba)
            .then(getInplayEventSaba)
            .then(getUpcomingEventSaba);

        jobs.push(new CronJob('*/20 * * * * *', function () {
            autoManualEvents();
        }, null, true, 'America/New_York'));

        // // jobs.push(new CronJob('*/3 * * * * *', function () {
        // //     crawlNumberGame();
        // // }, null, true, 'America/New_York'));

        // // jobs.push(new CronJob('*/13 * * * * *', function () {
        // //     crawlEndGameBet();
        // // }, null, true, 'America/New_York'));

        // // jobs.push(new CronJob('*/15 * * * * *', function () {
        // //     crawlFinishGame();
        // // }, null, true, 'America/New_York'));

        new CronJob('23 */7 * * * *', function () {
            checkMaintain();
        }, null, true, 'America/New_York');

        jobs.push(new CronJob('00 00 00 * * *', function () {
            resetWallet();
        }, null, true, 'America/New_York'));

        jobs.push(new CronJob('*/1 00-03 * * *', function () {
            const date_ob = new Date();
            console.log("fixMatchResults =========", date_ob.getHours() + ':' + date_ob.getMinutes() + ':' + date_ob.getSeconds())
            fixMatchResults();
        }, null, true, 'America/New_York'));

        // jobs.push(new CronJob('*/10 * * * * *', function () {
        jobs.push(new CronJob('*/20 * * * * *', function () {
            
            
            const date_ob = new Date();
            console.log('thy start cronjob getInplayEventSaba================', date_ob.getHours() + ':' + date_ob.getMinutes() + ':' + date_ob.getSeconds());
            
            
           // crawlResultData();
            // fixMatchResults();
            crawlInplayEventsUpdate();
            getInplayEventSaba();
        }, null, true, 'Asia/Ho_Chi_Minh'));

        jobs.push(new CronJob('10 */2 * * * *', function () {
            crawlUpcomingEventsUpdate();
            getUpcomingEventSaba();
        }, null, true, 'Asia/Ho_Chi_Minh'));

        jobs.push(new CronJob('00 */2 * * * *', function () {
            //checkEventTobeFixed();
            checkEventEndv2();
            checkEventRefund();
            checkEventCSEnd();
        }, null, true, 'Asia/Ho_Chi_Minh'));

        jobs.push(new CronJob('40 */5 * * * *', function () {
            crawlMultiEventsUpdate();
        }, null, true, 'Asia/Ho_Chi_Minh'));

        jobs.push(new CronJob('20 */5 * * * *', function () {
            
            const date_ob = new Date();
            console.log('thyxxxx auto cronjob cookie================', date_ob.getHours() + ':' + date_ob.getMinutes());
            
            getCookies()
                .then(crawlResultData)
                .then(getTokenAuthSaba)
                .then(getTokenDataSaba);
        }, null, true, 'Asia/Ho_Chi_Minh'));
        
        
        // when tivi expire
        jobs.push(new CronJob('*/30 * * * * *', function () {

            const date_ob = new Date();

            console.log('================thyxxxx prevent tivi expire ================', date_ob.getHours() + ':' + date_ob.getMinutes());

            getCookies()
                .then(getTokenAuthSaba)
                .then(getTokenDataSaba);
            
        }, null, true, 'Asia/Ho_Chi_Minh'));
        
    },

    stop: function () {
        jobs.map(function (item) {
            item && item.stop();
        });
    }
};
