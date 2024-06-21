'use strict';
var fs = require('fs');
var db = require('../../components/Sequelize');
var path = require('path');
var _ = require('lodash');
var baseName = path.join(__dirname, 'index.js');
db.models = {};
db.sequelize.sync().then(function () {
  _parse(path.join(__dirname, '..'), function (itemPath) {
    if (baseName.toString() !== itemPath.toString()) {
     
        var model = require(itemPath);
      if (model !== 'undefined' && model && model.name !== 'undefined' && model.name !== 'model') {
        db.models[model.name] = model;
      }
    }
  });
  Object.keys(db.models).forEach(function (modelName) {
    if(modelName != 'undefined'){
      if (db.models[modelName].options.hasOwnProperty('classMethods')) {
        if(db.models[modelName].options.classMethods.hasOwnProperty('associate'))
        //  console.log(' db.models[modelName]', db.models[modelName]);
        db.models[modelName].options.classMethods.associate(db.models);
      }
    }
//    
  });
function _parse(initPath, callback) {

  fs.readdirSync(initPath).forEach(function (name) {

    var itemPath = path.join(initPath, name)
        , stat = fs.statSync(itemPath);

    if (stat && stat.isDirectory(itemPath)) {

      //recursive dir reading
      _parse(itemPath, callback);

    } else {
      callback(itemPath, name);
    }
  });
}

//This syntax doesn't work either
  // if ("associate" in db[modelName]) {
  //   db[modelName].associate(db);
  // }
});

module.exports = db;