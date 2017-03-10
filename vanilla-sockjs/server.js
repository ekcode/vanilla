var http = require('http');
var sockjs = require('sockjs');

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });


var chatMembers = []
echo.on('connection', function(conn) {
    chatMembers.push(conn);
    console.log(chatMembers.chatId);
        
    conn.on('data', function(messageBody) {
        chatMembers.forEach(function (c, key) {
            console.log(messageBody);
            messageBody.id = c.id;
            c.write(messageBody);
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

