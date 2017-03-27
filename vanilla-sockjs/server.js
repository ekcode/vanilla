var http = require('http');
var sockjs = require('sockjs');
var redis = require('redis');


var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });
var db = redis.createClient();

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
            var memberList = JSON.parse(reply);


            memberList.forEach(function (c, key) {
                var res = {
                    type:'notiJoin',
                    nickname : data.nickname,
                    connId : conn.id
                };

                if(connections[c.connId]) {
                    connections[c.connId].write(JSON.stringify(res));
                }
            });

            var member = {
                connId: data.connId,
                nickname: data.nickname
            };
            memberList.push(member);

            db.set('chat_' + data.chatId, JSON.stringify(memberList));
        });
    },

    send: function(conn, data) {
        db.get('chat_' + data.chatId, function(err, reply) {
            var memberList = JSON.parse(reply);
            memberList.forEach(function (c, key) {
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

    unload: function(conn, data) {
        delete connections[conn.id];


        db.get('chat_' + data.chatId, function(err, reply) {
            var memberList = JSON.parse(reply);
            var res = {
                type: 'notiUnload'
            };
            var unloadMember = memberList.filter(function(member) { return member.connId == conn.id } );
            memberList = memberList.filter(function(member) { return member.connId != conn.id } );
            db.set('chat_' + data.chatId, JSON.stringify(memberList));


            res.memberList = memberList;
            res.unloadMember = unloadMember;

            memberList.forEach(function (member, key) {
                if(connections[member.connId]) {
                    connections[member.connId].write(JSON.stringify(res));
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

    connections[conn.id] = conn;

    conn.on('data', function(receiveData) {
        var data = JSON.parse(receiveData);
        handlers[data.type](conn, data);
    });

    conn.on('close', function() {
    });

});




var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');

