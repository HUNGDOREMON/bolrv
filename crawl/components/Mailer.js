const nodemailer = require('nodemailer');
const _ = require('lodash');
const path = require('path');
const config = require('../config');

const viewsPath = '../templates/emails/';
const SwigEngine = require('swig').Swig;
const swig = new SwigEngine({
    varControls: ['<%=', '%>'],
    cache: 'memory'
});

function Mailer (options) {
    this.transport = nodemailer.createTransport(options);
}

Mailer.prototype.render = function (template, options, callback) {
    swig.renderFile(path.join(__dirname, viewsPath, template), options || {}, callback);
};

Mailer.prototype.send = function (options, callback) {
    options = options || {};

    _.defaults(options, {
        from: config.MAIL_FROM
    });

    this.transport.sendMail(options, function (err, data) {
        callback && callback(err, data);
    });
};

Mailer.prototype.sendMail = function (template, emails, options, callback) {
    var self = this;
    _.defaults(options, {
        CDN_URL: config.CDN_URL
    });
    self.render(template, options, function (err, output) {
        if (err) {
            return callback(err);
        }

        self.send({
            from: 'YokoCab Support <customersupport@yokocab.com>',
            to: emails,
            cc: options.cc,
            subject: options.subject,
            html: output
        }, callback);
    });
};

Mailer.prototype.sendMarketingEmail = function (emails, options, callback) {
    this.send({
        from: 'YokoCab Support <customersupport@yokocab.com>',
        bcc: emails,
        subject: options.subject,
        html: options.content
    }, callback);
};

Mailer.prototype.close = function () {
    this.transport.close();
};

// export singleton
module.exports = new Mailer({
    host: config.MAIL_HOST,
    // service: 'mailgun',
    port: config.MAIL_PORT,
    secure: true, // use SSL
    auth: {
        user: config.MAIL_USERNAME,
        pass: config.MAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});
