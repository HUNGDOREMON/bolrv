const money = require('./money');
const oddslib = require('./oddslib').lib;

let service = {
    game_wheel: function (ball, term, stake, position) {
        let status = 'lose';
        let Xposition = -1;

        if (position >= 80 && position <= 154) {
            var needBall = position - 79;
            if (String(needBall) === String(ball)) {
                status = 'won';
                Xposition = 1;
            }
        } else {
            if (service.check_won(position, ball)) {
                status = 'won';
                Xposition = 1;
            }
        }

        var result = {
            status: status,
            profit: 0
        };
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, term);
        } else {
            result.profit = money.mul(Xposition, stake);
        }
        return result;
    },
    check_won: function (pos, ball) {
        var range = service.get_range(pos);
        if (range.indexOf('~') >= 0) {
            var list = range.split('~');
            if (ball >= parseInt(list[0]) && ball <= parseInt(list[1])) {
                return true;
            }
            return false;
        }

        var list = range.split(',').map(function (item) {
            return parseInt(item);
        });

        if (list.indexOf(ball) >= 0) {
            return true;
        }

        return false;
    },
    get_range: function (pos) {
        switch (pos) {
            case 74:
                return '1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71';
            case 75:
                return '2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72';
            case 76:
                return '3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63, 68, 73';
            case 77:
                return '4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64, 69, 74';
            case 78:
                return '5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75';

            case 48:
                return '1~5';
            case 49:
                return '6~10';
            case 50:
                return '11~15';
            case 51:
                return '16~20';
            case 52:
                return '21~25';
            case 53:
                return '26~30';
            case 54:
                return '31~35';
            case 55:
                return '36~40';
            case 56:
                return '41~45';
            case 57:
                return '46~50';
            case 58:
                return '51~55';
            case 59:
                return '56~60';
            case 60:
                return '61~65';
            case 61:
                return '66~70';
            case 62:
                return '71~75';

            case 64:
                return '1~15';
            case 65:
                return '16~30';
            case 66:
                return '31~45';
            case 67:
                return '45~60';
            case 68:
                return '61~75';

            case 70:
                return '1~25';
            case 71:
                return '26~50';
            case 72:
                return '51~75';
        }
    },
    game_next_combo: function (ball, term, stake, position) {
        let taixiu = 1;
        let lechan = 1;
        switch (position) {
            case 43:
                // 'Tài 37.5/Lẻ';
                taixiu = 1;
                lechan = 1;
                break;
            case 45:
                // 'Tài 37.5/Chẳn'
                taixiu = 1;
                lechan = -1;
                break;
            case 44:
                // 'Xỉu 37.5/Lẻ'
                taixiu = -1;
                lechan = 1;
                break;
            case 46:
                // 'Xỉu 37.5/Chẳn'
                taixiu = -1;
                lechan = -1;
                break;
        }

        let status = 'lose';
        let Xposition = -1;
        if ((ball - 37.5) * taixiu > 0 && (ball % 2 == 0 ? -1 : 1) * lechan > 0) {
            status = 'won';
            Xposition = 1;
        }
        var result = {
            status: status,
            profit: 0
        };
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, term);
        } else {
            result.profit = money.mul(Xposition, stake);
        }
        return result;
    },
    game_next_ou: function (ball, term, stake, position) {
        let status = 'lose';
        let Xposition = -1;
        if ((ball - 37.5) * (position == 30 ? 1 : -1) > 0) {
            status = 'won';
            Xposition = 1;
        }
        var result = {
            status: status,
            profit: 0
        };
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, term);
        } else {
            result.profit = money.mul(Xposition, stake);
        }
        return result;
    },
    game_next_oe: function (ball, term, stake, position) {
        let status = 'lose';
        let Xposition = -1;
        if ((ball % 2 == 0 ? 1 : -1) * (position == 34 ? 1 : -1) > 0) {
            status = 'won';
            Xposition = 1;
        }

        var result = {
            status: status,
            profit: 0
        };
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, term);
        } else {
            result.profit = money.mul(Xposition, stake);
        }
        return result;
    },
    handicap: function (ss, odd, term, stake, position) {
        term = parseFloat(term);
        stake = parseFloat(stake);
        let scores = ss.split('-');
        let homeScore = parseInt(scores[0]) - parseInt(scores[1]);
        let handicap_value = (odd.handicap_team == 'home' ? 1 : -1) * odd.handicap_value;
        let status = 'won';
        let Xposition = 1;
        if ((homeScore - handicap_value) * (position == 0 ? 1 : -1) > 0) {
            status = 'won';
            Xposition = 1;
        } else if (homeScore - handicap_value == 0) {
            status = 'draw';
            Xposition = 0;
        } else {
            status = 'lose';
            Xposition = -1;
        }

        let result = {
            status: status,
            profit: 0,
            returns: 0
        };
        let winVal = Math.abs(homeScore - handicap_value) > 0.25 ? 1 : 0.5;
        // term > 0 and win 
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, winVal, term);
        } else {
            result.profit = money.mul(Xposition, winVal, stake);
        }
        result.winVal = winVal;
        result.returns = stake + result.profit;
        return result;
    },
    overUnder: function (ss, odd, term, stake, position) {
        term = parseFloat(term);
        stake = parseFloat(stake);
        let scores = ss.split('-');
        let homeScore = parseInt(scores[0]) + parseInt(scores[1]);
        let handicap_value = odd.handicap_value;
        let status = 'won';
        let Xposition = 1;
        if ((homeScore - handicap_value) * (position == 0 ? 1 : -1) > 0) {
            status = 'won';
            Xposition = 1;
        } else if (homeScore - handicap_value == 0) {
            status = 'draw';
            Xposition = 0;
        } else {
            status = 'lose';
            Xposition = -1;
        }

        let result = {
            status: status,
            profit: 0,
            returns: 0
        };
        let winVal = Math.abs(homeScore - handicap_value) > 0.25 ? 1 : 0.5;
        // term > 0 and win 
        if (term * Xposition > 0) {
            result.profit = money.mul(stake, winVal, term);
        } else {
            result.profit = money.mul(Xposition, winVal, stake);
        }
        result.returns = stake + result.profit;
        result.winVal = winVal;
        return result;
    },
    correct_score: function (ss, odd, term, stake, position, type) {
        let scores = ss.replace('-', '_');
        let status = 'lose';

        if (scores === type) {
            status = 'won';
        }
        let result = {
            status: status,
            profit: 0,
            returns: 0
        };

        let winVal = 1;
        // term > 0 and win 
        if (status == 'won') {
            result.profit = money.mul(stake, winVal, money.subtract(term, 1));
        } else {
            result.profit = money.mul(-1, winVal, stake);
        }
        result.winVal = winVal;
        result.returns = stake + result.profit;
        return result;
    },
    odd1x2: function (ss, odd, term, stake, position) {
        term = parseFloat(term);
        stake = parseFloat(stake);
        let scores = ss.split('-');
        let homeScore = parseInt(scores[0]) - parseInt(scores[1]);
        let handicap_value = (odd.handicap_team == 'home' ? 1 : -1) * odd.handicap_value;
        let status = 'won';
        let Xposition = 1;
        if (homeScore > 0 && position == 0 || homeScore < 0 && position == 1 || homeScore == 0 && position == 2) {
            status = 'won';
            Xposition = 1;
        } else {
            status = 'lose';
            Xposition = -1;
        }

        let result = {
            status: status,
            profit: 0,
            returns: 0
        };
        let winVal = 1;
        // term > 0 and win 
        if (status == 'won') {
            result.profit = money.mul(stake, winVal, money.subtract(term, 1));
        } else {
            result.profit = money.mul(Xposition, winVal, stake);
        }
        result.winVal = winVal;
        result.returns = stake + result.profit;
        return result;
    },
    diffSs: function diffSs(old, newVal) {
        old = old.split('-');
        newVal = newVal.split('-');
        return (parseInt(newVal[0]) - parseInt(old[0])) + '-' + (parseInt(newVal[1]) - parseInt(old[1]));
    },
};

module.exports = service;

function calcHandicap(value) {
    let str = value.split('-');
    if (str.length == 1) {
        return parseFloat(str[0]);
    }
    return money.div(money.add(str[1], str[0]), 2);
}
// service.handicap('1-2', {
//     "home_od":-0.88,
//     "handicap_team":"away",
//     "handicap_value":"0-0.5",
//     "handicap":"0-0.5",
//     "away_od":
// 0.76}, -0.88, 0)
