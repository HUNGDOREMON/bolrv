'use strict';

const db = require('../components/Sequelize');

const model = db.sequelize.define('User', {
    // just add basic attributes which will be used in the app
    wallet: {
        type: db.Sequelize.DOUBLE
    },
    credit_line: {
        type: db.Sequelize.DOUBLE
    },
    discountAsian: {
        type: db.Sequelize.DOUBLE
    },
    online: {
        type: db.Sequelize.BOOLEAN
    }
}, {
    tableName: 'users',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    classMethods: {
        associate: function (models) {

        }
    }
});

module.exports = model;
