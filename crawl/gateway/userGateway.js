const Model = require('../db/User');
const db = require('../components/Sequelize');
const money = require('../libs/money');
const timeService = require('../libs/timeService');

let Gateway = {
    /**
     * ================ Query =============== 
     */
    findOne: (filter) => {
        return Model.findOne({where: filter});
    },
    findById: (id) => {
        return Gateway.findOne({id: id});
    },
    findAll: (filter, order, limit, offset) => {
        return Model.findAll({limit: limit, order: order, offset: offset, where: filter});
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
    updateOnline (userId, online) {
        return Model.update({ online }, {
            where: {
                id: userId
            }
        });
    },

    updateALlOffline () {
        return Model.update({ online: false }, {
            where: {}
        });
    },

    updateWallet: (userId, bet) => {
        let amount = money.add(bet.bet_pre_pay, bet.total_profit);
        if (timeService.campareDateToday(bet.created_at)) {
            return Model.increment({ wallet: amount }, { by: 0, where: { id: userId } });
        }
        return new Promise(function (resolve, reject) {
            resolve();
        });
    },

    resetWallet: () => {
        return db.sequelize.query('UPDATE users SET wallet=credit_line where wallet <> credit_line and user_type = \'member\'').spread((results, metadata) => {
            return metadata;
        });
    },

    getCommision: (id) => {
        return Gateway.findById(id);
    }
};

module.exports = Gateway;
