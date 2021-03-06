var http = require('http');
var sockjs = require('sockjs');
var redis = require('redis');


var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });
var db = redis.createClient('redis://h:p8dff5fb6823f11f843e975a45135dc5d518994ea6cf663333f4286eb79322349@ec2-34-206-56-163.compute-1.amazonaws.com:9769');

db.on('connect', function() {
    console.log('redis connected');
});


var connections = {};

var handlers = {
    init: function(conn, data) {
        var res = {
            connId: conn.id,
            type: 'join',
            nickname : data.nickname
        };
        conn.write(JSON.stringify(res));
    },

    join: function(conn, data) {
        db.get('chat_' + data.chatId, function(err, reply) {
            var userList = JSON.parse(reply) || [];
            var user = {
                connId: data.connId,
                nickname: data.nickname
            };
            userList.push(user);


            userList.forEach(function (c, key) {
                var res = {
                    type:'notiJoin',
                    nickname: data.nickname,
                    connId: conn.id,
                    userList: userList
                };

                if(connections[c.connId]) {
                    connections[c.connId].write(JSON.stringify(res));
                }
            });


            db.set('chat_' + data.chatId, JSON.stringify(userList));
        });
    },

    send: function(conn, data) {
        db.get('chat_' + data.chatId, function(err, reply) {
            var userList = JSON.parse(reply) || [];
            userList.forEach(function (c, key) {
                var res = {
                    type: 'send',
                    nickname : data.nickname,
                    connId : conn.id,
                    message : data.message
                };

                if(connections[c.connId]) {
                    connections[c.connId].write(JSON.stringify(res));
                }
            });

        });

    },

    timeout: function(conn, data) {
        delete connections[conn.id];
        db.del(['chat_' + data.chatId, 'timeout_' + data.chatId]);
    }

}

echo.on('connection', function(conn) {
    console.log(conn.url);

    connections[conn.id] = conn;

    conn.on('data', function(receiveData) {
        var data = JSON.parse(receiveData);
        handlers[data.type](conn, data);
    });

    conn.on('close', function() {
        console.log('close');
        var chatId = conn.pathname.substr(conn.pathname.indexOf('_') + 1, 5)

        delete connections[conn.id];


        db.get('chat_' + chatId, function(err, reply) {
            var userList = JSON.parse(reply) || [];
            var res = {
                type: 'notiUnload'
            };
            var unloaduser = userList.filter(function(user) { return user.connId == conn.id } );

            userList = userList.filter(function(user) { return user.connId != conn.id } );
            db.set('chat_' + chatId, JSON.stringify(userList));

            res.userList = userList;
            res.nickname = unloaduser[0] ? unloaduser[0].nickname : 'Ghost User';

            userList.forEach(function (user, key) {
                if(connections[user.connId]) {
                    connections[user.connId].write(JSON.stringify(res));
                }
            });
        });
    });

});



var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
var port = process.env.PORT || 9999;
server.listen(port, '0.0.0.0');

