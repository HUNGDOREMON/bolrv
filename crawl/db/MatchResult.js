const db = require('../components/Sequelize');

const model = db.sequelize.define('MatchResult', {
    // just add basic attributes which will be used in the app
    match_group_id: {
        type: db.Sequelize.STRING
    },
    match_date: {
        type: db.Sequelize.STRING
    },
    is_delete: {
        type: db.Sequelize.BOOLEAN
    },
    hf_check: {
        type: db.Sequelize.BOOLEAN
    },
    ft_check: {
        type: db.Sequelize.BOOLEAN
    },
    refund_check: {
        type: db.Sequelize.BOOLEAN
    },
    away_team: {
        type: db.Sequelize.STRING
    },
    home_team: {
        type: db.Sequelize.STRING
    },
    home_id: {
        type: db.Sequelize.INTEGER
    },
    away_id: {
        type: db.Sequelize.INTEGER
    },
    ht_home_score: {
        type: db.Sequelize.INTEGER
    },
    ht_away_score: {
        type: db.Sequelize.INTEGER
    },
    away_score: {
        type: db.Sequelize.INTEGER
    },
    home_score: {
        type: db.Sequelize.INTEGER
    },
    match_over_1h: {
        type: db.Sequelize.INTEGER
    },
    match_over: {
        type: db.Sequelize.INTEGER
    }
}, {
    tableName: 'match_results',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = model;
