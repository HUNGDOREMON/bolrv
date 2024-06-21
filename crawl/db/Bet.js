'use strict';

var db = require('../components/Sequelize');

var model = db.sequelize.define('Bet', {
    //just add basic attributes which will be used in the app
    event_id: {
        type: db.Sequelize.STRING
    },
    odd_id: {
        type: db.Sequelize.STRING
    },
    user_id: {
        type: db.Sequelize.INTEGER
    },
    group_id: {
        type: db.Sequelize.INTEGER
    },
    bet_amount: {
        type: db.Sequelize.DOUBLE
    },
    bet_pre_pay: {
        type: db.Sequelize.DOUBLE
    },
    bet_profit: {
        type: db.Sequelize.DOUBLE
    },
    bet_commission: {
        type: db.Sequelize.DOUBLE
    },
    total_profit: {
        type: db.Sequelize.DOUBLE
    },
    bet_value: {
        type: db.Sequelize.FLOAT
    },
    bet_position: {
        type: db.Sequelize.INTEGER
    },
    number_step: {
        type: db.Sequelize.INTEGER
    },
    time_status: {
        type: db.Sequelize.INTEGER
    },
    time_position: {
        type: db.Sequelize.INTEGER
    },
    bet_type: {
        type: db.Sequelize.STRING
    },
    type: {
        type: db.Sequelize.STRING
    },
    bet_kind: {
        type: db.Sequelize.STRING
    },
    bet_status: {
        type: db.Sequelize.STRING
    },
    last_ss: {
        type: db.Sequelize.STRING
    },
    odd: {
        type: db.Sequelize.JSON
    },
    time: {
        type: db.Sequelize.STRING
    },
    ss: {
        type: db.Sequelize.STRING
    },
    reds: {
        type: db.Sequelize.JSON
    },
    status: {
        type: db.Sequelize.STRING
    },
    finished_at: {
        type: db.Sequelize.DATE
    },
    has_full: {
        type: db.Sequelize.BOOLEAN
    }
}, {
    tableName: 'bets',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    lassMethods: {
        associate: function (models) {
            models.Bet.belongsTo(models.Event, {foreignKey: 'event_id', targetKey: 'event_id'});
        }
    }
});
//'pending', 'runing', 'cancel', 'done'
model.statics = model.statics || {};
model.statics.STATUS = {
    PENDING: 'pending',
    RUNING: 'runing',
    CANCEL: 'cancel',
    DONE: 'done'
};

model.statics.BET_STATUS = {
    WON: 'won',
    DRAW: 'draw',
    REFUND: 'refund',
    LOSE: 'lose'
};

model.statics.KIND = {
    NORMAL: 'normal',
    GROUP: 'group',
    ITEM: 'item'
};

module.exports = model;