'use strict';

var db = require('../components/Sequelize');

var model = db.sequelize.define('Event', {
    // just add basic attributes which will be used in the app
    event_id: {
        type: db.Sequelize.STRING
    },
    parent_id: {
        type: db.Sequelize.STRING
    },
    league_id: {
        type: db.Sequelize.STRING
    },
    live_id: {
        type: db.Sequelize.STRING
    },
    league_name: {
        type: db.Sequelize.STRING
    },
    status: {
        type: db.Sequelize.STRING
    },
    type: {
        type: db.Sequelize.STRING
    },
    time_status: {
        type: db.Sequelize.INTEGER
    },
    order: {
        type: db.Sequelize.INTEGER
    },
    time_position: {
        type: db.Sequelize.INTEGER
    },
    start_time: {
        type: db.Sequelize.STRING
    },
    time: {
        type: db.Sequelize.STRING
    },
    hf_check: {
        type: db.Sequelize.BOOLEAN
    },
    can_finish: {
        type: db.Sequelize.BOOLEAN
    },
    has_new_score: {
        type: db.Sequelize.BOOLEAN
    },
    ss: {
        type: db.Sequelize.STRING
    },
    hf_ss: {
        type: db.Sequelize.STRING
    },
    home: {
        type: db.Sequelize.STRING
    },
    away: {
        type: db.Sequelize.STRING
    },
    timer: {
        type: db.Sequelize.JSON
    },
    reds: {
        type: db.Sequelize.JSON
    },
    extra: {
        type: db.Sequelize.JSON
    },
    new_score_at: {
        type: db.Sequelize.DATE
    },
    haft_time_at: {
        type: db.Sequelize.DATE
    },
    start_date: {
        type: db.Sequelize.DATE
    },
    is_manual: {
        type: db.Sequelize.BOOLEAN
    },
    correct_score: {
        type: db.Sequelize.JSON
    },
    is_cs: {
        type: db.Sequelize.BOOLEAN
    },
    early: {
        type: db.Sequelize.BOOLEAN
    },
    saba: {
        type: db.Sequelize.BOOLEAN
    }
}, {
    tableName: 'events',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    classMethods: {
        associate: function (models) {
            models.Event.belongsTo(models.Odd, { foreignKey: 'event_id', targetKey: 'event_id' });
        }
    }
});

model.statics = model.statics || {};
model.statics.STATUS = {
    NOT_STARTED: 0,
    INPLAY: 1,
    TO_BE_FIXED: 2,
    ENDED: 3,
    POSTPONED: 4,
    REFUND: 5
};

module.exports = model;
