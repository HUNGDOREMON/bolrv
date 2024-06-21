const config = require('../config');
const Redis = require('./Redis');
const kue = require('kue');
let queue = null;

const mapJobName = {
    checkBetStatus: 'checkBetStatus',
    checkBetDone: 'checkBetDone',
    crawlUpcomingOddsQueue: 'crawlUpcomingOddsQueue',
    crawlUpcomingEventsUpdateQueue: 'crawlUpcomingEventsUpdateQueue',
    crawlInplayEventsUpdateQueue: 'crawlInplayEventsUpdateQueue'
};

const priority = {
    low: 'low',
    normal: 'normal',
    medium: 'medium',
    high: 'high',
    critical: 'critical'
};

function _publish (routingKey, body, priority = 'medium', delay = 0, callback) {
    if (!queue) {
        return callback(new Error('Connection is not ready yet!'));
    }

    let job = queue.create(routingKey, body).delay(delay).priority(priority);
    job.removeOnComplete(true).save(callback);

    // Debug
    job.on('complete', function () {
        console.log('Job', job.id, 'type ', job.type, 'with data', job.data, 'is    done');
    }).on('failed', function (error) {
        // TODO save logs
        console.log('Job', job.id, 'type ', job.type, 'with data', job.data, 'has  failed ', error);
    });
}

module.exports = {
    queue: queue,

    mapJobName: mapJobName,
    /**
     * publish a message
     *
     * @param {String} routingKey
     * @param {Mixed} body
     * @param {Object} options
     * @param {Function} callback
     * @returns {void}
     */
    publish: _publish,

    init: function () {
        if (queue) return queue;
        queue = kue.createQueue({
            redis: {
                createClientFactory: function () {
                    return Redis.getClient(config.queueDB);
                }
            }
        });

        queue.watchStuckJobs(6000);

        queue.on('error', function (err) {
            console.log('Oops... ', err);
        });

        return queue;
    },

    test: function (name) {
        console.log('test', name);
        _publish(name, name, 'medium', 0, function () {
            console.log('saved');
        });
    },

    checkBetStatus: function (data) {
        _publish(mapJobName.checkBetStatus, data, priority.medium, 0, function (a) {
            console.log('create job checkBetStatus');
        });
    },

    checkBetDone: function (data) {
        _publish(mapJobName.checkBetDone, data, priority.medium, 0, function () {
            console.log('create job checkBetDone');
        });
    },

    crawlUpcomingOddsQueue: function (data) {
        _publish(mapJobName.crawlUpcomingOddsQueue, data, priority.medium, 0, function () {
            console.log('create job odds');
        });
    },

    crawlInplayEventsUpdateQueue: function (data) {
        _publish(mapJobName.crawlInplayEventsUpdateQueue, data, priority.medium, 0, function () {
            console.log('create job odds');
        });
    },
    crawlUpcomingEventsUpdateQueue: function (data) {
        _publish(mapJobName.crawlUpcomingEventsUpdateQueue, data, priority.medium, 0, function () {
            console.log('create job odds');
        });
    }
};
