/* eslint-disable camelcase */
const Model = require('../db/Odd');
const db = require('../components/Sequelize');
const Op = db.Sequelize.Op;

let Gateway = {
    /**
     * ================ Query =============== 
     */
    findOne: (filter, include, attributes, raw = false) => {
        return Model.findOne({ where: filter, include: include, attributes: attributes, raw: raw });
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

    updateAttributes: function (event_id, attributes) {
        return Model.update(attributes, {
            where: {
                event_id: event_id,
                saba: false
            }
        });
    },
    updateToPeding: function (ids, status, saba) {
        return Model.update({
            odd_status: Model.statics.STATUS.PENDING
        }, {
            where: {
                is_manual: false,
                early: { [Op.in]: [null, false] },
                odd_status: status,
                odd_id: {
                    [Op.notIn]: ids
                },
                saba: saba,
            }
        });
    },
    updateToPedingE: function (ids, status) {
        return Model.update({
            odd_status: Model.statics.STATUS.PENDING
        }, {
            where: {
                is_manual: false,
                early: true,
                odd_status: status,
                odd_id: {
                    [Op.notIn]: ids
                },
                saba: false
            }
        });
    },
    findRuningOdd: function (event_id, is_end) {
        let where = {
            event_id: event_id,
            status: 'active'
        };
        if (!is_end) {
            where = {
                event_id: event_id,
                status: 'active',
                hf_check: false
            };
        }

        return Model.findAll({
            where: where
        });
    },
    updateParlay: function (ids) {
        return Model.update({
            is_parlay: true
        }, {
            where: {
                odd_id: {
                    [Op.in]: ids
                },
                saba: false
            }
        });
    }
};

module.exports = Gateway;
