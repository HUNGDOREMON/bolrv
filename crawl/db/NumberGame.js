'use strict';

var db = require('../components/Sequelize');

var model = db.sequelize.define('NumberGame', {
    //just add basic attributes which will be used in the app
    event_id: {
        type: db.Sequelize.STRING
    },
    code: {
        type: db.Sequelize.STRING
    },
    name: {
        type: db.Sequelize.STRING
    },
    type: {
        type: db.Sequelize.STRING
    },
    is_check: {
        type: db.Sequelize.BOOLEAN
    },
    last_ball: {
        type: db.Sequelize.INTEGER
    },
    step: {
        type: db.Sequelize.INTEGER
    },
    data: {
        type: db.Sequelize.JSON
    },
    ball_numbers: {
        type: db.Sequelize.JSON
    },
    date: {
        type: db.Sequelize.DATE
    },
    status: {
        type: db.Sequelize.STRING
    }
}, {
    tableName: 'number_games',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    classMethods: {
    associate: function (models) {
      
    }
  },
});

module.exports = model;