/* eslint-disable camelcase */
/* eslint-disable prefer-promise-reject-errors */
const Model = require('../db/Event');
const db = require('../components/Sequelize');
const Op = db.Sequelize.Op;
const timeService = require('../libs/timeService');
const leagueGateway = require('./leagueGateway');
const oddGateway = require('./oddGateway');
const matchGateway = require('./matchGateway');
const async = require('async');
const _ = require('lodash');
let Gateway = {
    /**
     * ================ Query ===============
     */
    findOne: (filter) => {
        return Model.findOne({ where: filter });
    },
    findEventWithTimeStatusDone: (filter) => {
        return Model.findAll({ where: filter });
    },
    findById: (id) => {
        return Gateway.findOne({ id: id });
    },
    /**
     *  ============== Action =============
     */
    newModel: (data) => {
        return new Model(data);
    },
    create: (data) => {
        return Model.create(data);
    },
    upsert: (data, condition, skip = false, saba = false) => {
        if (skip) {
            return new Promise(function (resolve, reject) {
                let run = false;
                let interval = setInterval(function () {
                    if (run) return;
                    run = true;
                    Model.count().then(function (count) {
                        if (count > 0) {
                            clearInterval(interval);
                            resolve();
                        }
                        run = false;
                    }).catch(function () {
                        clearInterval(interval);
                        reject();
                    });
                }, 500);
            });
        }
        return Model.findOne({ where: condition })
            .then(function (obj) {
                if (obj) { // update
                    let HTHomeScore = 0;
                    let HTAwayScore = 0;
                    let homeScore = 0;
                    let awayScore = 0;
                    let MatchOver1H = 0;
                    let MatchOver = 0;
                    data.extra = obj.extra || {};
                    data.extra.ss = data.extra.ss || [];
                    let oldlength = data.extra.ss.length;
                    data.extra.ss = data.extra.ss.concat(countScores(obj.ss, data.ss));
                    if (data.time_status === 0) {
                        data.time_position = 0;
                    } else if (data.time_status === 1) {
                        data.time_position = 1;
                    }

                    let fistTime = /^1H [0-9]/g.exec(data.time);
                    if (data.time === 'H.Time' || data.time === 'Ref_htime') {
                        data.time_position = 2;
                        data.hf_ss = data.ss;
                        data.haft_time_at = timeService.nowUs();
                        if (saba) {
                            MatchOver1H = 1;
                            HTHomeScore = data.hf_ss.split('-')[0];
                            HTAwayScore = data.hf_ss.split('-')[1];
                        }
                    } else if (fistTime) {
                        data.hf_ss = data.ss;
                        if (saba) {
                            MatchOver1H = 0;
                            HTHomeScore = data.hf_ss.split('-')[0];
                            HTAwayScore = data.hf_ss.split('-')[1];
                        }
                    }
                    let valid = /^2H 4[3-9]/g.exec(data.time);
                    if (valid || data.type === 'conner') {
                        data.can_finish = true;
                        if (saba) {
                            homeScore = data.ss.split('-')[0];
                            awayScore = data.ss.split('-')[1];
                        }
                    } else if (obj.hf_ss && saba) {
                        HTHomeScore = obj.hf_ss.split('-')[0];
                        HTAwayScore = obj.hf_ss.split('-')[1];
                    }

                    if (oldlength !== data.extra.ss.length) {
                        data.has_new_score = true;
                        data.new_score_at = timeService.nowUs();
                    }

                    if (data.time === 'Ref_live' && saba) {
                        homeScore = data.ss.split('-')[0];
                        awayScore = data.ss.split('-')[1];
                    }
                    if (saba) {
                        matchGateway.upsert({
                            match_group_id: data.event_id,
                            match_date: data.start_time,
                            away_team: data.away,
                            home_team: data.home,
                            ht_home_score: HTHomeScore,
                            ht_away_score: HTAwayScore,
                            home_score: homeScore,
                            match_over_1h: MatchOver1H,
                            away_score: awayScore,
                            match_over: MatchOver,
                            home_id: data.home_id,
                            away_id: data.away_id,
                            is_delete: false
                        }, {
                            match_group_id: data.event_id
                        });
                    }
                    delete data.home_id;
                    delete data.away_id;
                    return obj.update(data);
                } else { // insert
                    let HTHomeScore = 0;
                    let HTAwayScore = 0;
                    let homeScore = 0;
                    let awayScore = 0;
                    let MatchOver1H = 0;
                    let MatchOver = 0;
                    data.extra = {};
                    data.extra.ss = [];
                    data.extra.ss = countScores('0-0', data.ss);
                    if (data.time_status === 0) {
                        data.time_position = 0;
                    } else if (data.time_status === 1) {
                        data.time_position = 1;
                    }

                    let fistTime = /^1H [0-9]/g.exec(data.time);
                    if (data.time === 'H.Time' || data.time === 'Ref_htime') {
                        data.time_position = 2;
                        data.hf_ss = data.ss;
                        if (saba) {
                            MatchOver1H = 1;
                            HTHomeScore = data.hf_ss.split('-')[0];
                            HTAwayScore = data.hf_ss.split('-')[1];
                        }
                    } else if (fistTime) {

                        data.hf_ss = data.ss;
                        if (saba) {
                            MatchOver1H = 0;
                            HTHomeScore = data.hf_ss.split('-')[0];
                            HTAwayScore = data.hf_ss.split('-')[1];
                        }
                    }
                    let valid = /^2H 4[6-9]/g.exec(data.time);
                    if (valid || data.type === 'conner') {
                        data.can_finish = true;
                        if (saba) {
                            homeScore = data.ss.split('-')[0];
                            awayScore = data.ss.split('-')[1];
                        }
                    }

                    if (data.time === 'Ref_live' && saba) {
                        homeScore = data.ss.split('-')[0];
                        awayScore = data.ss.split('-')[1];
                    }
                    if (saba) {
                        matchGateway.upsert({
                            match_group_id: data.event_id,
                            match_date: data.start_time,
                            away_team: data.away,
                            home_team: data.home,
                            ht_home_score: HTHomeScore,
                            ht_away_score: HTAwayScore,
                            home_score: homeScore,
                            match_over_1h: MatchOver1H,
                            away_score: awayScore,
                            match_over: MatchOver,
                            home_id: data.home_id,
                            away_id: data.away_id,
                            is_delete: false
                        }, {
                            match_group_id: data.event_id
                        });
                    }
                    delete data.home_id;
                    delete data.away_id;
                    return Model.create(data);
                }
            });
    },


    /**
     * =============== Custom =========
     */
    saveFromAPI: function (list, status, saba) {
        let cacheLeagues = [];
        let cacheEvents = [];
        return new Promise(function (resolve, reject) {
            let oddIds = [];
            async.mapLimit(list, 5, function (item, cb) {
                let skipEvent = cacheEvents.indexOf(item.event_id) > -1;
                cacheEvents.push(item.event_id);
                let evenData = {};
                if (saba) {
                    evenData = {
                        event_id: item.event_id,
                        parent_id: item.parent_id,
                        league_id: item.league_id,
                        league_name: item.league_name,
                        live_id: item.live_id,
                        time: item.time,
                        type: item.type,
                        order: item.order,
                        time_status: item.time_status,
                        start_time: item.start_time,
                        ss: item.ss,
                        home: item.home,
                        home_id: item.home_id,
                        away_id: item.away_id,
                        away: item.away,
                        can_finish: true,
                        reds: item.reds,
                        saba: true
                    };
                } else {
                    evenData = {
                        event_id: item.event_id,
                        parent_id: item.parent_id,
                        league_id: item.league_id,
                        league_name: item.league_name,
                        live_id: item.live_id,
                        time: item.time,
                        type: item.type,
                        order: item.order,
                        time_status: item.time_status,
                        start_time: item.start_time,
                        ss: item.ss,
                        home: item.home,
                        away: item.away,
                        timer: item.timer,
                        reds: item.reds,
                        saba: saba,
                        early: item.early
                    };
                }
                Gateway.upsert(evenData, { event_id: item.event_id }, skipEvent, saba)
                    .then(() => {
                        if (saba) {
                            let i = 0;
                            item.odds.forEach(async (odd) => {
                                i++;
                                const oddId = await oddGateway.upsert({
                                    odd_id: `${item.event_id}${i}`,
                                    event_id: item.event_id,
                                    league_id: item.league_id,
                                    live_id: item.live_id,
                                    order: i,
                                    type: item.type,
                                    odd_status: item.time_status,
                                    corner_type: item.corner_type,
                                    ft_hdp: odd.ft_hdp || {},
                                    ft_ou: odd.ft_ou || {},
                                    ft_1x2: odd.ft_1x2 || {},
                                    hf_hdp: odd.hf_hdp || {},
                                    hf_ou: odd.hf_ou || {},
                                    hf_1x2: odd.hf_1x2 || {},
                                    saba: true
                                }, { odd_id: `${item.event_id}${i}` });

                                oddIds.push(oddId.odd_id);
                            });
                            return oddIds;
                        } else {
                            return oddGateway.upsert({
                                odd_id: item.odd_id,
                                event_id: item.event_id,
                                league_id: item.league_id,
                                live_id: item.live_id,
                                order: item.order,
                                type: item.type,
                                odd_status: item.time_status,
                                corner_type: item.corner_type,
                                ft_hdp: item.ft_hdp,
                                ft_ou: item.ft_ou,
                                ft_1x2: item.ft_1x2,
                                hf_hdp: item.hf_hdp,
                                hf_ou: item.hf_ou,
                                hf_1x2: item.hf_1x2,
                                saba: false,
                                early: item.early
                            }, { odd_id: item.odd_id });
                        }
                    }).then(function (oddIds) {
                        if (saba) {
                            let value = {
                                league_id: item.league_id,
                                name: item.league_name,
                                type: 'saba'
                            };
                            if (status === 1) {
                                value.order = 0;
                            } else {
                                value.order_upcoming = 1;
                            }
                            if (cacheLeagues.indexOf(item.league_id) > -1) {
                                return;
                            }
                            cacheLeagues.push(item.league_id);
                            leagueGateway.upsert(value, { league_id: item.league_id.toString() });
                            return oddIds;
                        } else {
                            let value = {
                                league_id: item.league_id,
                                name: item.league_name,
                                type: 'socer'
                            };
                            if (status === 1) {
                                value.order = item.order;
                            } else {
                                value.order_upcoming = item.order;
                            }
                            if (cacheLeagues.indexOf(item.league_id) > -1) {
                                return;
                            }
                            cacheLeagues.push(item.league_id);
                            return leagueGateway.upsert(value, { league_id: item.league_id });
                        }
                    }).then(function (oddIds) {
                        cb();
                        if (saba) {
                            return oddIds;
                        }
                    }).catch(function (err) {
                        cb(err);
                    });
            }, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(oddIds);
            });
        });
    },
    updatefinishEvent: function (ids, saba) {
        return Model.update({
            time_status: Model.statics.STATUS.ENDED
        }, {
            where: {
                time_status: Model.statics.STATUS.INPLAY,
                can_finish: true,
                event_id: {
                    [Op.notIn]: ids
                },
                saba: false
            }
        });
    },
    updatefinishEventSaba: function (ids, saba) {
        return Model.update({
            time_status: Model.statics.STATUS.ENDED
        }, {
            where: {
                time_status: Model.statics.STATUS.INPLAY,
                can_finish: true,
                event_id: {
                    [Op.notIn]: ids
                },
                [Op.or]: [
                    {
                        [Op.and]: [
                            { hf_ss: { [Op.is]: null } },
                            { ss: { [Op.not]: '0-0' } }
                        ]
                    },
                    { hf_ss: { [Op.not]: null } }
                ],
                saba: saba
            }
        });
    },
    updateRefundEventSaba: function (ids) {
        return Model.update({
            time_status: Model.statics.STATUS.REFUND
        }, {
            where: {
                time_status: Model.statics.STATUS.INPLAY,
                event_id: {
                    [Op.notIn]: ids
                },
                ss: '0-0',
                hf_ss: { [Op.is]: null },
                saba: true
            }
        });
    },
    updateTobeFixEvent: function (ids) {
        return Model.update({
            time_status: Model.statics.STATUS.TO_BE_FIXED
        }, {
            where: {
                is_manual: false,
                time_status: Model.statics.STATUS.INPLAY,
                can_finish: false,
                event_id: {
                    [Op.notIn]: ids
                },
                saba: false
            }
        });
    },
    updateTobeFixEventUpcomming: function (ids, saba) {
        return Model.update({
            time_status: Model.statics.STATUS.TO_BE_FIXED
        }, {
            where: {
                is_manual: false,
                early: false,
                time_status: Model.statics.STATUS.NOT_STARTED,
                event_id: {
                    [Op.notIn]: ids
                },
                saba: saba
            }
        });
    },
    updateTobeFixEventEUpcomming: function (ids, saba) {
        return Model.update({
            time_status: Model.statics.STATUS.TO_BE_FIXED
        }, {
            where: {
                is_manual: false,
                early: true,
                time_status: Model.statics.STATUS.NOT_STARTED,
                event_id: {
                    [Op.notIn]: ids
                },
                saba: saba
            }
        });
    },
    getManualEvents: function () {
        return Model.findAll({
            where: {
                time_status: {
                    [Op.notIn]: [Model.statics.STATUS.ENDED]
                },
                status: 'active',
                is_manual: true,
                type: { [Op.ne]: 'saba' }
            },
            raw: true
        }).then(function (data) {
            return data;
        });
    },
    getInplayIdsAndSs: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.INPLAY,
                type: { [Op.ne]: 'saba' }
            },
            attributes: ['event_id', 'ss', 'time_status'],
            raw: true
        }).then(function (data) {
            return data;
        });
    },
    getActiveEventAndFinish: function () {
        return Model.findAll({
            where: {
                [Op.or]: [
                    {
                        time_status: Model.statics.STATUS.ENDED,
                        status: 'active',
                        updated_at: {
                            [Op.lte]: timeService.subtractMinute(1)
                        },
                       saba: true
                    },
                    {
                        hf_check: false,
                        status: 'active',
                        time_status: Model.statics.STATUS.INPLAY,
                        time_position: 2,
                        saba: true
                    }
                ]
            }
        });
    },
    getRefundEventAndFinish: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.REFUND,
                status: 'active',
                type: { [Op.ne]: 'saba' }
            }
        });
    },
    getNewScoreEvent: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.INPLAY,
                has_new_score: true,
                new_score_at: {
                    [Op.lte]: timeService.subtractMinute(1)
                },
                type: { [Op.ne]: 'saba' }
            }
        });
    },
    updateAttributes: function (event_id, attributes) {
        return Model.update(attributes, {
            where: {
                event_id: event_id,
                saba: false
            }
        });
    },
    getInplayIds: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.INPLAY
            },
            attributes: ['event_id'],
            raw: true
        }).then(function (data) {
            return _.map(data, function (item) { return item.event_id; });
        });
    },
    getUpcomingIds: function (argument) {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.NOT_STARTED
            },
            attributes: ['event_id'],
            raw: true
        }).then(function (data) {
            return _.map(data, function (item) { return item.event_id; });
        });
    },
    getUpcomingIdsAndSs: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.NOT_STARTED
            },
            attributes: ['event_id', 'ss', 'time_status'],
            raw: true
        }).then(function (data) {
            return data;
        });
    },
    resetCorrectScore: function () {
        return Model.update({ is_cs: false }, {
            where: {
                status: 'active',
                time_status: Model.statics.STATUS.INPLAY,
                saba: false
            }
        });
    },
    getEventTobeFixed: function () {
        return Model.findAll({
            where: {
                time_status: Model.statics.STATUS.TO_BE_FIXED
            },
            attributes: ['event_id', 'ss', 'time_status'],
            raw: true
        }).then(function (data) {
            return data;
        });
    }
};

function countScores(old, newVal) {
    if (old === newVal) {
        return [];
    }
    var oldL = old.split('-');
    var newValL = newVal.split('-');
    var list = [];
    for (var i = 0; i < parseInt(newValL[0]) - parseInt(oldL[0]); i++) {
        list.push(0);
    }
    for (var j = 0; j < parseInt(newValL[1]) - parseInt(oldL[1]); j++) {
        list.push(1);
    }

    return list;
}

module.exports = Gateway;
