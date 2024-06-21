const Model = require('../db/Bet');
const db = require('../components/Sequelize');
const money = require('../libs/money');
const oddslib = require('../libs/oddslib');
const timeService = require('../libs/timeService');
const userGateway = require('../gateway/userGateway');
const Q = require('../components/Q');
const Op = db.Sequelize.Op;
const _ = require('lodash');

let Gateway = {
    model: Model,
    /**
     * ================ Query =============== 
     */
    findOne: (filter) => {
        return Model.findOne({ where: filter });
    },
    findById: (id) => {
        return Gateway.findOne({ id: id });
    },
    findAll: (filter, order, limit, offset) => {
        return Model.findAll({ limit: limit, order: order, offset: offset, where: filter });
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
    upsert: (data, condition, obj) => {
        if (obj) {
            return obj.update(data);
        }
        return Model.findOne({ where: condition })
            .then(function (obj) {
                if (obj) { // update
                    return obj.update(data);
                } else { // insert
                    return Model.create(data);
                }
            });
    },
    /**
     * =============== Custom =========
     */
    findBetGame: (number_id, number_step) => {
        return Gateway.findAll({
            status: Model.statics.STATUS.RUNING,
            number_id: String(number_id),
            number_step: {
                [Op.lt]: parseInt(number_step)
            }
        });
    },
    findPending: (limit) => {
        return Gateway.findAll({
            status: Model.statics.STATUS.PENDING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
            }
        }, [['id', 'ASC']], limit);
    },
    updatePerentDone: (group_id, bet_id) => {
        return Gateway.findOne({
            id: group_id,
            bet_kind: Model.statics.KIND.GROUP,
            status: Model.statics.STATUS.RUNING
        })
            .then((betMain) => {
                if (!betMain) {
                    return;
                }
                return Model.count({
                    where: {
                        group_id: group_id,
                        bet_kind: Model.statics.KIND.ITEM,
                        status: Model.statics.STATUS.DONE,
                        bet_status: Model.statics.BET_STATUS.LOSE,
                        has_full: true
                    },
                    raw: true
                }).then(function (count) {
                    if (count > 0) {
                        betMain.bet_profit = money.mul(-1, betMain.bet_amount);
                        betMain.bet_status = Model.statics.BET_STATUS.LOSE;
                        betMain.status = 'done';
                        return Gateway.updateBet(betMain).then(function () {
                            return null;
                        });
                    }
                    return betMain;
                });
            })
            .then(function (betMain) {
                if (!betMain) {
                    return;
                }
                return Model.count({
                    where: {
                        group_id: group_id,
                        bet_kind: Model.statics.KIND.ITEM,
                        status: Model.statics.STATUS.RUNING
                    },
                    raw: true
                }).then(function (count) {
                    if (count > 0) {
                        return;
                    }
                    return betMain;
                });
            })
            .then(function (betMain) {
                if (!betMain) {
                    return;
                }
                // DONE
                return Model.findAll({
                    where: {
                        group_id: group_id,
                        bet_kind: Model.statics.KIND.ITEM,
                        bet_status: {
                            [Op.ne]: Model.statics.BET_STATUS.REFUND
                        }
                    },
                    attributes: ['status', 'id', 'bet_status', 'has_full', 'bet_value', 'last_ss'],
                    raw: true
                }).then(function (list) {
                    if (!list.length || (list.length === 1 && list[0].bet_status === Model.statics.BET_STATUS.WON)) {
                        betMain.bet_profit = 0;
                        betMain.bet_status = Model.statics.BET_STATUS.REFUND;
                    } else {
                        let lose = list.findIndex(function (item) {
                            if (item.has_full && item.bet_status === Model.statics.BET_STATUS.LOSE) {
                                return true;
                            }
                            return false;
                        }) > -1;
                        if (lose) {
                            betMain.bet_profit = money.mul(-1, betMain.bet_amount);
                            betMain.bet_status = Model.statics.BET_STATUS.LOSE;
                        } else {
                            let wins = _.map(list, function (item) {
                                let bet_value = oddslib.malyToDecimal(item.bet_value); // need convert to decimal
                                if (item.bet_status === Model.statics.BET_STATUS.WON && item.has_full) {
                                    return bet_value;
                                }
                                if (item.bet_status === Model.statics.BET_STATUS.WON && !item.has_full) {
                                    return money.add(money.div(money.add(bet_value, -1), 2), 1);
                                }
                                if (item.bet_status === Model.statics.BET_STATUS.LOSE) {
                                    return 0.5;
                                }

                                return 1;
                            });
                            let rate = _.reduce(wins, function (sum, n) {
                                return money.mul(sum, n);
                            }, 1);

                            betMain.bet_value = rate;
                            betMain.bet_profit = money.add(money.mul(rate, betMain.bet_amount), money.mul(-1, betMain.bet_amount));
                            if (betMain.bet_profit === 0) {
                                betMain.bet_status = Model.statics.BET_STATUS.DRAW;
                            } else if (betMain.bet_profit > 0) {
                                betMain.bet_status = Model.statics.BET_STATUS.WON;
                            } else {
                                betMain.bet_status = Model.statics.BET_STATUS.LOSE;
                            }
                        }
                    }
                    betMain.status = 'done';
                    return Gateway.updateBet(betMain);
                });
            });
    },
    updateBet: (bet) => {
        return userGateway.getCommision(bet.user_id)
            .then(function (data) {
                if (!!data.discountAsian && bet.bet_status !== Model.statics.BET_STATUS.DRAW && bet.bet_status !== Model.statics.BET_STATUS.REFUND) {
                    bet.bet_commission = money.mul(data.discountAsian, bet.bet_amount);
                }
                bet.total_profit = money.add(bet.bet_commission, bet.bet_profit);
                bet.finished_at = timeService.nowUs();
                return bet.save();
            })
            .then(function (bet) {
                if (bet.bet_kind === Model.statics.KIND.ITEM) {
                    Q.checkBetDone({ group_id: bet.group_id, bet_id: bet.id });
                } else {
                    return userGateway.updateWallet(bet.user_id, bet);
                }
            });
    },
    updatePerentStatus: (group_id, bet_id) => {
        return Gateway.findOne({
            id: group_id,
            bet_kind: Model.statics.KIND.GROUP,
            status: {
                [Op.in]: [Model.statics.STATUS.PENDING, Model.statics.STATUS.CANCEL]
            }
        }).then((betMain) => {
            if (!betMain) {
                return;
            }
            if (betMain.status === Model.statics.STATUS.PENDING) {
                return Model.findAll({
                    where: {
                        group_id: group_id,
                        bet_kind: Model.statics.KIND.ITEM
                    },
                    attributes: ['status'],
                    raw: true
                }).then(function (listStatus) {
                    let cancel = 0;
                    let runing = 0;
                    _.map(listStatus, function (item) {
                        if (item.status === Model.statics.STATUS.CANCEL) {
                            cancel++;
                        } else if (item.status === Model.statics.STATUS.RUNING) {
                            runing++;
                        }
                    });
                    if (runing >= 3) {
                        // runing
                        betMain.status = Model.statics.STATUS.RUNING;
                        return betMain.save();
                    }
                    if (listStatus.length - cancel < 3) {
                        betMain.status = Model.statics.STATUS.CANCEL;
                        return betMain.save().then(function () {
                            return Gateway.updateStatus(bet_id, Model.statics.STATUS.CANCEL);
                        });
                    }
                });
            }
            // udate cancel
            return Gateway.updateStatus(bet_id, Model.statics.STATUS.CANCEL);
        });
    },
    updateStatus: (id, status) => {
        return Model.update({
            status: status
        }, {
            where: {
                id: id
            }
        });
    },
    findRuningByOddId: (odd_id, isEnd, limit) => {
        var where = {
            status: Model.statics.STATUS.RUNING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
            },
            odd_id: odd_id
        };
        if (!isEnd) {
            where = {
                status: Model.statics.STATUS.RUNING,
                odd_id: odd_id,
                bet_kind: {
                    [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
                },
                bet_type: {
                    [Op.in]: ['hf_hdp', 'hf_ou', 'hf_1x2']
                }
            };
        }
        return Gateway.findAll(where, [['id', 'ASC']], limit);
    },
    findRunningByEventId: (eventId, isEnd, limit) => {
        let where = {
            status: Model.statics.STATUS.RUNING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
            },
            event_id: eventId
        };
        if (!isEnd) {
            where = {
                status: Model.statics.STATUS.RUNING,
                event_id: eventId,
                bet_kind: {
                    [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
                },
                bet_type: {
                    [Op.in]: ['hf_hdp', 'hf_ou', 'hf_1x2']
                }
            };
        }
        return Gateway.findAll(where, [['id', 'ASC']], limit);
    },

    findRunningByEventCorrectScropId: (limit) => {
        let where = {
            status: Model.statics.STATUS.RUNING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM],
            },
            bet_type: 'correct_score'
        };

        return Gateway.findAll(where, [['id', 'ASC']], limit);
    },
    findRunningByEventEnd: (eventId, limit) => {
        let where = {
            status: Model.statics.STATUS.RUNING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
            },
            event_id: eventId,
            include: [{
                model: 'Event',
                where: {
                    status: 'done'
                }
            }]
        };
        return Gateway.findAll(where, [['id', 'ASC']], limit);
    },
    getOverUnder: (odd_id, limit) => {
        return Gateway.findAll({
            status: Model.statics.STATUS.RUNING,
            bet_kind: {
                [Op.in]: [Model.statics.KIND.NORMAL, Model.statics.KIND.ITEM]
            },
            odd_id: odd_id,
            bet_type: {
                [Op.or]: ['ft_ou', 'hf_ou']
            }
        }, [['id', 'ASC']], limit);
    }
};

module.exports = Gateway;
