const Model = require('../db/League');
const db = require('../components/Sequelize');

let Gateway = {
    /**
     * ================ Query =============== 
     */
    findOne: (filter) => {
        return Model.findOne({where: filter});
    },
    findById: (id) => {
        return Gateway.findOne({id: id});
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
    upsert: (data, condition) => {
        return Model.findOne({ where: condition })
        .then(function(obj) {
            if(obj) { // update
                return obj.update(data);
            }
            else { // insert
                return Model.create(data);
            }
        });
    },
    /**
     * =============== Custom =========
     */
};

module.exports = Gateway; 