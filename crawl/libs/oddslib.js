const oddslib = require('oddslib');
let timeService = require('./timeService');
const listNames = ['home_od', 'draw_od', 'away_od', 'over_od', 'under_od'];

let services = {
    lib: oddslib,
    decimalToMaly: function (value) {
        if (value === '-') return value;
        if (value <= 1) return '-';
        return oddslib.from('decimal', value).to('malay', {precision: 2});
    },
    malyToDecimal: function (value) {
        return oddslib.from('malay', value).to('decimal', {precision: 2});
    },
    decimalObjtoMaly: function (obj) {
        var result = {};
        for (var key in obj) {
            if (key === 'handicap') {
                let handi = handicap188bet(obj[key]);
                result['handicap_team'] = handi.handicap_team;
                result['handicap_value'] = handi.handicap_value;
            }
            if (listNames.indexOf(key) > -1) {
                result[key] = services.decimalToMaly(obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
        return result;
    },
    decimalObjtoMaly188bet: function (oldValue, newValue, event) {
        if (newValue) {
            oldValue = services.decimalObjtoMaly(newValue);
        }
        if (event.time_status === 0) {
            return oldValue;
        }
        // && diffFromNow(oldValue.add_time) < 20
        if (oldValue) {
            return oldValue;
        }
        return null;
    },
    randomNumberGame: function (except) {
        except = except || [];
        return generateRandom(1, 75, except);
    }
};

function generateRandom (min, max, except) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return (except && except.indexOf(num) >= 0) ? generateRandom(min, max, except) : num;
}

function diffTimer (time_str, timer) {
    const first = time_str ? parseInt(time_str.split(':')[0]) : 0;
    const second = timer && timer.tm ? timer.tm : 0;
    console.log(first + ' ' + second);
    return Math.abs(first - second);
}

function diffFromNow (time) {
    return Math.abs((timeService.currentTimestamp() - time) / 60);
}

function handicap (values) {
    var list = values.split(',');
    list = list.map(function (item) {
        return parseFloat(item);
    });
    var item1 = list[0];
    if (list.length === 1) {
        if (item1 === 0 || item1 < 0) {
            item1 = Math.abs(item1);
            return {
                handicap_team: 'away',
                handicap_value: item1 == 0 ? 0 : Number.isInteger(item1) ? item1 + '.0' : item1
            };
        } else {
            return {
                handicap_team: 'home',
                handicap_value: Number.isInteger(item1) ? item1 + '.0' : item1
            };
        }
    }

    var item2 = list[1];
    if (item2 > 0) {
        return {
            handicap_team: 'home',
            handicap_value: Math.abs(item1) + '-' + Math.abs(item2)
        };
    }

    return {
        handicap_team: 'away',
        handicap_value: Math.abs(item1) + '-' + Math.abs(item2)
    };
}

function handicap188bet (values) {
    const handicap_team = values.charAt(0) === '-' ? 'home' : 'away';
    var list = values.split('/');
    list = list.map(function (item) {
        return parseFloat(item);
    });

    return {
        handicap_team: handicap_team,
        handicap_value: list.length === 2 ? Math.abs(list[0]) + '-' + Math.abs(list[1]) : Math.abs(list[0])
    };
}

// console.log(handicap('0.0,-0.5'));
// console.log(handicap188bet('-0/0.5'));
// console.log(handicap188bet('-0.5'));
// console.log(handicap188bet('0.5'));

module.exports = services;
