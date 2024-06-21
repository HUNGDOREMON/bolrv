const _ = require('lodash');

let service = {
	add: (...params) => {
        let sum = 0;
        _.forEach(params, value => {
            sum = run('plus', sum, value);
        });
        return sum;
    },
    subtract: (a, b) => {
        return run('minus', a, b);
    },
    mul: (...params) => {
        let result = 1;
        _.forEach(params, value => {
            result = run('times', result, value); 
        });
        return result;
    },
    div: (a, b) => {
		return run('dividedBy', a, b);
	}
};

function run(fn, a, b) {
    let x = new BigNumber(a)
    let y = new BigNumber(b)
    return parseFloat(x[fn](y));
}

module.exports = service;
