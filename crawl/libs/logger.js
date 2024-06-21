let winston = require('winston');
winston.add(winston.transports.File, { filename: path.join('logs', 'winston.log') });
winston.remove(winston.transports.Console);

module.exports = {
	info: (data) => {
		winston.info(data);
	}
}