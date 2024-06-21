const path = require('path');
const fs = require('fs');
const config = require('../config');
const Q = require('./Q');
const WaitList = require('./WaitList');
const asyncLib = require('../libs/asyncLib');
const Socket = require('../components/Socket');
const Raven = require('raven');

function _parse (initPath, callback) {
    fs.readdirSync(initPath).forEach(function (name) {
        const itemPath = path.join(initPath, name);
        const stat = fs.statSync(itemPath);

        if (stat && stat.isDirectory(itemPath)) {
            // recursive dir reading
            _parse(itemPath, callback);
        } else {
            callback(itemPath, name);
        }
    });
}

module.exports = {
    /**
     * set up queue process
     * @returns {void}
     */
    queue: function () {
        let queue = Q.init();

        console.log('MQ is readdy!');
        _parse(path.join(__dirname, '..', 'queues'), function (itemPath) {
            require(itemPath)(queue);
        });
    },

    workers: function () {
        require('../workers').run();
    },

    autoCheckBet: function () {
        WaitList.autoCheckBet();
    },

    relation: function () {
        _parse(path.join(__dirname, '..', 'db', 'relation'), function (itemPath) {
            require(itemPath);
        });
    },

    initSentry: function () {
        if (config.APP_REPORT_URL) {
            Raven.config(config.APP_REPORT_URL, { sendTimeout: 5 }).install();
        }
    },

    socketIO: function (io) {
        Socket.init(io);
    },

    shutdown: function () {
       
        process.on('uncaughtException', (err) => {
            console.log('Shutdown uncaughtException', err);
            shutdown();
        });
        process.on('SIGINT', (err) => {
            console.log('Shutdown SIGINT', err);
            shutdown();
        });

        function shutdown () {
            process.exit(0);
            // asyncLib.async.parallel([
            //     function (callback) {
            //         console.log('----- Shutdown Kue --- ');
            //         Q.init().shutdown(60000, function (err) {
            //             console.log('----- Shutdown Kue Done --- ', err || '');
            //             callback();
            //         });
            //     },
            //     function (callback) {
            //         console.log('----- Shutdown WaitList --- ');
            //         WaitList.shutdown(function () {
            //             console.log('----- Shutdown WaitList Done --- ');
            //             callback();
            //         });
            //     },
            //     function (callback) {
            //         console.log('----- Shutdown workers --- ');
            //         require('../workers').stop();
            //         setTimeout(function () {
            //             console.log('----- Shutdown workers Done --- ');
            //             callback();
            //         }, 20000);
            //     }
            // ],
            // // optional callback
            // function(err, results) {
            //     process.exit(0);
            // });
        }
    }
};
