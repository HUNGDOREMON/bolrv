const moment = require('moment-timezone');
moment.tz.setDefault('America/New_York'); // default timezoon

let service = {
    moment: moment,
    nowUs: () => {
        return moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString();
    },
    nowInSing: (format = 'MM/DD/YYYY') => {
        return moment(new Date()).format(format).toString();
    },
    nextDayInSing: (number = 1, format = 'MM/DD/YYYY') => {
        return moment().add(number, 'd').format(format).toString();
    },
    subtractMinute: (number = 5) => {
        // return new Date(new Date() - number * 60 * 1000);
        return moment(new Date()).subtract(number, 'm').format('YYYY-MM-DD HH:mm:ss').toString();
    },
    convert24to12: (time) => {
        return moment(time, 'H:mm').format('hh:mmA').toString();
    },
    getTodayDate: () => {
        return moment(new Date()).format('MM/DD').toString();
    },
    campareDateToday: (date) => {
        return moment(new Date()).format('YYYY-MM-DD').toString() === moment(date).format('YYYY-MM-DD').toString();
    },
    format: function (date) {
        return moment(date);
    },
    formatTimeMatch: function (date) {
        const data = moment() - moment(date);
        const tempTime = moment.duration(data);

        return tempTime.hours() * 60 + tempTime.minutes();
    },
    sqlDate: function (date) {
        return moment(date).format('YYYY-MM-DD HH:mm:ss');
    },
    formatDateTime: function (date) {
        return moment(date, 'YYYYMMDDHH:mm').format('YYYY-MM-DD HH:mm:00').toString();
    },
    getLastDays: function (number = 30) {
        return moment().subtract(number, 'd').format('YYYY-MM-DD');
    },
    currentTimestamp: function () {
        return moment().unix();
    },
    getMiliByHourMinus: (time = '00:00') => {
        return moment(moment(time, 'H:mm').format('H:mm').toString(), 'H:mm').valueOf() / 1000;
    },
    formatTimeStatus: function (input) {
        if (!input || input.tm === 0 && String(input.tt) === '0') {
            return 0; // 'not_live';
        }
        var hh = 1;
        if (input.tm < 45 || input.ta > 0 && input.tm < 55) {
            hh = 1; // 'first_time';
        } else if (input.tm >= 45 && input.tm < 55 && String(input.tt) === 0) {
            hh = 2; // 'half_time';
        } else {
            hh = 3; // 'second_time';
        }
        return hh;
    }
};

module.exports = service;
