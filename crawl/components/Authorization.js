const config = require('../config');
const jwt = require('jsonwebtoken');
// const User = require('../db/User');

module.exports = {
    verifyJwt: function (socket, next) {
        // verity jwt and bin user data into socket object
        // then we can use these data through the app
        const handshakeData = socket.request;
        if (!handshakeData._query || !handshakeData._query.token) {
            return next(new Error('Missing auth token!'));
        }

        try {
            var decoded = jwt.verify(handshakeData._query.token, config.JWT_SECRET);
            console.log(decoded);
            // if (decoded.type === 'admin') {
            socket.userId = decoded.sub;

            //     return next();
            // }
            return next();
            // User.findByAuthToken(decoded.type, decoded.token, function(err, user) {
            //     if (err) {
            //         return next(err);
            //     }

            //     //get user attribute and pin to socket element
            //     socket.user = {
            //         type: decoded.type,
            //         data: user,
            //     };
            //     return next();
            // });
        } catch (err) {
            return next(err);
        }
    }
};
