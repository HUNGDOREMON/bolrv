'use strict';

var db = require('../components/Sequelize');

var model = db.sequelize.define('League', {
    //just add basic attributes which will be used in the app
    league_id: {
        type: db.Sequelize.STRING
    },
    order: {
        type: db.Sequelize.INTEGER
    },
    order_upcoming: {
        type: db.Sequelize.INTEGER
    },
    name: {
        type: db.Sequelize.STRING
    }
}, {
    tableName: 'leagues',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = model;