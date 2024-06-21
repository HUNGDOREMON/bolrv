const Q = require('../components/Q');
const betGateway = require('../gateway/betGateway');

module.exports = function (connection) {
    connection.process(Q.mapJobName.checkBetDone, 1, function (job, done) {
        let data = job.data;
        console.log('start job', job.id, data);
        betGateway.updatePerentDone(data.group_id, data.bet_id)
            .then(function () {
                done && done();
            })
            .catch(function (err) {
                done && done(err);
            });
    });
};
