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
    console.log(conn.id);

    connections[conn.id] = conn;

    conn.on('data', function(data) {

        console.log('data: ' + data);
        var jsonData = JSON.parse(data);

        if(jsonData.type == 'JOIN') {

            var existChat = false;

            db.exists('chat_' + jsonData.chatId, function(err, reply) {
                if (reply === 1) {
                    console.log('chat exists');
                    db.get('chat_' + jsonData.chatId, function(err, members) {
                        var membersJson = JSON.parse(members);
                        var member = {id: conn.id, nickname: jsonData.nickname};
                        membersJson.push(member);
                        db.set('chat_' + jsonData.chatId, JSON.stringify(membersJson));
                    });
                } else {
                    console.log('create chat');
                    var member = {id: conn.id, nickname: jsonData.nickname};
                    var members = [member];


                    db.set('chat_' + jsonData.chatId, JSON.stringify(members));
                }
            });
        }


        if(jsonData.type == 'SEND') {
            var chatId = jsonData.chatId;
            db.get('chat_' + chatId, function(err, reply) {
                var membersJson = JSON.parse(reply);
                console.log(membersJson);
                membersJson.forEach(function (c, key) {
                    var res = {};
                    res.message = jsonData.message;
                    res.loginId = jsonData.nickname;
                    res.id = conn.id;
                    console.log('c.id ' + c.id);
                    console.log(connections);
                    if(connections[c.id]) {
                        connections[c.id].write(JSON.stringify(res));
                    }
                });

            });

        }
//        chatMembers.forEach(function (c, key) {
//
//
//
//            var chatGroup = {chatId: jsonData.chatId, members: []};
//
//            chatMembers.push(chatGroup);
//
//        });
//
//
//        if(jsonData.type == 'SEND') {
//        }
//
//        if(jsonData.type == 'IMAGE') {
//        }
//
//
//        chatMembers.forEach(function (c, key) {
//
//
//            var res = {};
//            res.message = JSON.parse(data).message;
//            res.loginId = JSON.parse(data).loginId;
//            res.id = conn.id;
//
//            console.log(JSON.stringify(res));
//            c.write(JSON.stringify(res));
//        });
    });

    conn.on('close', function() {
        console.log('close me ', conn.id);
        //chatMembers.splice(chatMembers.indexOf(conn), 1);
    });
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');

