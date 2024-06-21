'use strict';

var db = require('../components/Sequelize');

var model = db.sequelize.define('Odd', {
    // just add basic attributes which will be used in the app
    event_id: {
        type: db.Sequelize.STRING
    },
    odd_id: {
        type: db.Sequelize.STRING
    },
    league_id: {
        type: db.Sequelize.STRING
    },
    live_id: {
        type: db.Sequelize.STRING
    },
    type: {
        type: db.Sequelize.STRING
    },
    corner_type: {
        type: db.Sequelize.INTEGER
    },
    odd_status: {
        type: db.Sequelize.INTEGER
    },
    ft_hdp: {
        type: db.Sequelize.JSON
    },
    ft_ou: {
        type: db.Sequelize.JSON
    },
    ft_1x2: {
        type: db.Sequelize.JSON
    },
    hf_hdp: {
        type: db.Sequelize.JSON
    },
    hf_ou: {
        type: db.Sequelize.JSON
    },
    hf_1x2: {
        type: db.Sequelize.JSON
    },
    status: {
        type: db.Sequelize.STRING
    },
    hf_check: {
        type: db.Sequelize.BOOLEAN
    },
    is_parlay: {
        type: db.Sequelize.BOOLEAN
    },
    order: {
        type: db.Sequelize.INTEGER
    },
    is_manual: {
        type: db.Sequelize.BOOLEAN
    },
    early: {
        type: db.Sequelize.BOOLEAN
    },
    saba: {
        type: db.Sequelize.BOOLEAN
    }
}, {
    tableName: 'odds',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    classMethods: {
        associate: function (models) {
            models.Odd.belongsTo(models.Event, {foreignKey: 'event_id', targetKey: 'event_id'});
        }
    }
});

model.statics = model.statics || {};
model.statics.STATUS = {
    NOT_STARTED: 0,
    INPLAY: 1,
    PENDING: 2,
    ENDED: 3,
    POSTPONED: 4,
    CANCELLED: 5
};

module.exports = model;
