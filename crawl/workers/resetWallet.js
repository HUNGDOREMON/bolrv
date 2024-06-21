const _ = require('lodash');
const userGateway = require('../gateway/userGateway');
const asyncLib = require('../libs/asyncLib');

module.exports = function () {
    console.log('reset wallet', new Date());
    userGateway.resetWallet()
    .then(function (data) {
        console.log('reset wallet done', data);
    }).catch(function (err) {
        console.log('reset wallet done with ', err);
    });
};