'use strict';

const config = require('./../config');
const userGateway = require('../gateway/userGateway');

function Socket () {}

Socket.appId = config.app.name;
Socket.room = 'global';
Socket.EVENT_DISCONNECT = '_disconnected';

Socket.emitToSockets = function (userIds, event, data) {
    userIds.forEach((userId) => {
        Socket.emitToSocket(userId, event, data);
    });
};

Socket.emitToSocket = function (userId, event, data) {
    this.io.to(userId).emit(event, data);
};

/**
 * check user is in the redis store (for check online/offline)
 *
 * @param {String} userId
 * @param {Function} cb
 * @returns {void}
 */
Socket.hasUser = function (userId, cb) {
    this.io.in(userId).clients((err, clients) => {
        cb(!err && clients && clients.length);
    });
};

Socket.getClientsById = function (userId, cb) {
    this.io.in(userId).clients(cb);
};

Socket.sendToRoom = function (room, event, data) {
    this.io.in(room).emit(event, data);
};

function run (socketIo) {
    socketIo.on('connection', (socket) => {
        console.log('User connected', socket.userId);
        userGateway.updateOnline(socket.userId, true);

        socket.on('disconnect', function () {
            userGateway.updateOnline(socket.userId, false);
            console.log(`User ${socket.userId} disconnected`);
        });
    });
}
Socket.init = function (socketIo) {
    console.log('Socket initialization');
    userGateway.updateALlOffline().then(() => {
        this.io = socketIo;
        run(socketIo);
    });
};

module.exports = Socket;
