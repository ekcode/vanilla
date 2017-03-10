var http = require('http');
var sockjs = require('sockjs');

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });


var chatMembers = []
echo.on('connection', function(conn) {
    console.log(conn.id);
    chatMembers.push(conn);
    var auth = {};
    auth.type = 'AUTH';
    auth.id = conn.id;
    conn.write(JSON.stringify(auth));
        
    conn.on('data', function(messageBody) {
        chatMembers.forEach(function (c, key) {
            var res = {};
            res.message = JSON.parse(messageBody).message;
            res.loginId = JSON.parse(messageBody).loginId;
            res.id = conn.id;
            console.log(JSON.stringify(res));
            c.write(JSON.stringify(res));
        });
    });
    conn.on('close', function() {
        console.log('close me ', conn.id);
        chatMembers.splice(chatMembers.indexOf(conn), 1);  
    });
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');

