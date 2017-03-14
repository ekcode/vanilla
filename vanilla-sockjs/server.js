var http = require('http');
var sockjs = require('sockjs');
var redis = require('redis');


var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });
var db = redis.createClient();

db.on('connect', function() {
    console.log('redis connected');
});


var connections = {};

echo.on('connection', function(conn) {

    connections[conn.id] = conn;
    console.log(connections);
    console.log(conn.id);

    conn.on('data', function(data) {

        var reqJson = JSON.parse(data);

        if(reqJson.type == 'INIT') {
            var res = {};
            res.connId = conn.id;
            res.type = 'JOIN';
            conn.write(JSON.stringify(res));
        }

        if(reqJson.type == 'JOIN') {
            var res = {};
            res.connId = reqJson.connId;
            res.type = reqJson.type;
            res.nickname = reqJson.nickname;


            db.get('chat_' + reqJson.chatId, function(err, reply) {
                var memberList = JSON.parse(reply);


                memberList.forEach(function (c, key) {
                    var res = {type:'NOTI-JOIN'};
                    res.nickname = reqJson.nickname;
                    res.connId = conn.id;

                    if(connections[c.connId]) {
                        connections[c.connId].write(JSON.stringify(res));
                    }
                });

                var member = {connId: reqJson.connId, nickname: reqJson.nickname};
                memberList.push(member);


                db.set('chat_' + reqJson.chatId, JSON.stringify(memberList));
            });

        }


        if(reqJson.type == 'SEND') {
            var chatId = reqJson.chatId;
            db.get('chat_' + chatId, function(err, reply) {
                var memberList = JSON.parse(reply);
                memberList.forEach(function (c, key) {
                    var res = {type: 'SEND'};
                    res.message = reqJson.message;
                    res.loginId = reqJson.nickname;
                    res.connId = conn.id;
                    if(connections[c.connId]) {
                        connections[c.connId].write(JSON.stringify(res));
                    }
                });

            });
        }

        if(reqJson.type =='UNLOAD') {
            var chatId = reqJson.chatId;

            db.get('chat_' + chatId, function(err, reply) {
                var memberList = JSON.parse(reply);
                var res = {type: 'NOTI-UNLOAD'};

                memberList.forEach(function (c, key) {

                    if(c.connId == conn.id) {
                        var member = memberList[key];
                        console.log(memberList);
                        console.log('key- '+ key);
                        
                        remainMemberList = memberList.filter(function(el) { return el.connId != conn.id } );
                        db.set('chat_' + chatId, JSON.stringify(remainMemberList));
                    }

                    res.memberList = remainMemberList;
                    if(connections[c.connId]) {
                        connections[c.connId].write(JSON.stringify(res));
                    }

                });
            });

        }

        conn.on('close', function() {
            delete connections[conn.id];
        });
    });
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');

