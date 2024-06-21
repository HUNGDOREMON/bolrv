const express = require('express');
const app = express();
const http = require('http').createServer(app);
const Bootstrap = require('./components/Bootstrap');
const Authorization = require('./components/Authorization');
const socketIo = require('socket.io')(http);
const redisIo = require('socket.io-redis');
const userGateway = require('./gateway/userGateway');
const config = require('./config');
const redis = require('redis');
const fixMatchResults = require('./workers/fixMatchResults');
//socketIo.origins('*:*');

//socketIo.adapter(redisIo({ host: config.redis.host, port: config.redis.port }));
//const pubClient = redis.createClient(config.redis.port, config.redis.host, { auth_pass: "RWzf@(V@Hps1+igQ5" });

socketIo.origins('*:*');

// socketIo.adapter(redisIo({ host: config.redis.host, port: config.redis.port, auth_pass: "bongda@1234" }));



const redisAdapter = require('socket.io-redis');
//const pubClient = redis.createClient(config.redis.port, config.redis.host, { auth_pass: "RWzf@(V@Hps1+igQ5" });
const pubClient = redis.createClient(config.redis.port, config.redis.host, { auth_pass: config.redis.pass });
const subClient = pubClient.duplicate();
socketIo.adapter(redisAdapter({ pubClient, subClient }));



socketIo.use(function (socket, next) {
    Authorization.verifyJwt(socket, next);
});

socketIo.on('connection', (socket) => {
    console.log('User connected', socket.userId);
    userGateway.updateOnline(socket.userId, true);

    socket.on('disconnect', function () {
        userGateway.updateOnline(socket.userId, false);
        console.log(`User ${socket.userId} disconnected`);
    });
});
Bootstrap.relation();
Bootstrap.queue();
Bootstrap.workers();
Bootstrap.autoCheckBet();
Bootstrap.shutdown();
// Bootstrap.socketIO(socketIo);
app.route("/fixMatchResults").get((req,res)=>{
    fixMatchResults().then((data)=>{
        if(data){
            res.status(200).send({status:"OK",data:true});
        }else{
            res.status(200).send({status:"OK",data:false});
        }
    });
    
})
http.listen(3000, () => {
    console.log('listening on *:3000');
});
