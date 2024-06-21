const async = require("async");

module.exports = {
	async: async,
	whilst: function (test, iteratee) {
		return new Promise(function (resolve, reject) {
			async.whilst(test, iteratee, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	},
	each: function (coll, iteratee) {
		return new Promise(function (resolve, reject) {
			async.each(coll, iteratee, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	},
	eachLimit: function (coll, limit, iteratee) {
		return new Promise(function (resolve, reject) {
			async.eachLimit(coll, limit, iteratee, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	},
	during: function (test, fn) {
		return new Promise(function (resolve, reject) {
			async.during(test, fn, function (err, data) {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}
}