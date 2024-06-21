const Model = require('../db/MatchResult');
const db = require('../components/Sequelize');
const Op = db.Sequelize.Op;
const async = require('async');

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
    findMatchResultWithTimeStatusDone: (filter) => {
        return Model.findAll({ where: filter });
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

    saveALl: (list) => {
        return new Promise(function (resolve, reject) {
            async.mapLimit(list, 10, function (item, cb) {
                return Gateway.upsert({
                    match_group_id: item.MatchGroupId,
                    match_date: item.MatchDate,
                    away_team: item.AwayTeam,
                    home_team: item.HomeTeam,
                    ht_home_score: item.HTHomeScore,
                    ht_away_score: item.HTAwayScore,
                    home_score: item.HomeScore,
                    match_over_1h: item.MatchOver1H,
                    away_score: item.AwayScore,
                    match_over: item.MatchOver,
                    home_id: item.HomeId,
                    away_id: item.AwayId,
                    is_delete: item.isDelete
                }, {
                    match_group_id: item.MatchGroupId
                }).then(() => {
                    cb();
                });
            }, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    },
    getActiveEventAndFinish: function () {
        return Model.findAll({
            where: {
                [Op.or]: [
                    {
                        ft_check: false,
                        match_over: 1
                    },
                    {
                        hf_check: false,
                        match_over_1h: 1
                    }
                ]
            }
        });
    },
    getActiveEventAndFinishByGroupId: function (matchGrouId) {
        return Model.find({
            where: {
                [Op.or]: [
                    {
                        match_group_id: matchGrouId,
                        ft_check: false,
                        match_over: 1
                    },
                    {
                        match_group_id: matchGrouId,
                        hf_check: false,
                        match_over_1h: 1
                    }
                ]
            }
        });
    },
    getRefundEventAndFinish: function () {
        return Model.findAll({
            where: {
                match_over: 2,
                refund_check: false
            }
        });
    },
    getMatchs: () => {
        return Model.findAll({
            where: {
                [Op.or]: [
                    {
                        ft_check: false,
                        match_over: 0
                    },
                    {
                        hf_check: false,
                        match_over_1h: 0
                    }
                ]
            }
        });
    }
};

module.exports = Gateway;
