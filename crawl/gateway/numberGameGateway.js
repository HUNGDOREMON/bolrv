const Model = require('../db/NumberGame');
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
        .then(function(obj) {
            if(obj) { // update
                if (obj.status == 'closed') {
                    return;
                }
                if (obj.step != data.step) {
                    data.date = new Date()
                }
                return obj.update(data);
            }
            else { // insert
                data.date = new Date()
                return Model.create(data);
            }
        });
    },
    /**
     * =============== Custom =========
     */
    getGameNeedFinish: () => {
        return Gateway.findAll({
            status: 'runing',
            step: 2,
            date: {
                [Op.lt]: new Date(new Date() - 60 * 1000)
            },
        }, [['id', 'DESC']]);
    },
    getGameCheck: () => {
        return Gateway.findAll({
            is_check: false
        }, [['id', 'DESC']]);
    },
    getGameNeedFinishStep: () => {
        return Gateway.findAll({
            status: 'runing',
            date: {
                [Op.lt]: new Date(new Date() - 8 * 60 * 1000)
            },
        }, [['id', 'DESC']]);
    }
};

module.exports = Gateway;