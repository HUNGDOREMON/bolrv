const config = require('../config');
const Sequelize = require('sequelize');

// read more config here http://docs.sequelizejs.com/en/v3/docs/getting-started/
const sequelize = new Sequelize(
    config.DB_DATABASE,
    config.DB_USERNAME,
    config.DB_PASSWORD,
    {
        dialect: 'postgres',
        host: config.DB_HOST,
        port: config.DB_PORT,
        logging: config.DB_LOGGING === 'true',
        pool: {
            max: 100,
            min: 0,
            idle: 10000,
            // @note https://github.com/sequelize/sequelize/issues/8133#issuecomment-359993057
            acquire: 1000000, //20000
            evict: 10000
        },
        operatorsAliases: false,
        timezone: 'America/New_York',
        dialectOptions: {
            multipleStatements: true
        }
    }
);

exports.sequelize = sequelize;
exports.Sequelize = Sequelize;
