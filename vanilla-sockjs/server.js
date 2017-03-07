var http = require('http');
var sockjs = require('sockjs');

var echo = sockjs.createServer({ sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js' });


var family = []
echo.on('connection', function(conn) {
    family.push(conn);
    console.log(family);
        
    conn.on('data', function(message) {
        family.forEach(function (c, key) {
            msgBody = {};
            msgBody.message = message;
            msgBody.writer = conn.id;
            console.log(JSON.stringify(msgBody));
            c.write(JSON.stringify(msgBody));
        });
    });
    conn.on('close', function() {
        console.log('close me ', conn.id);
        family.splice(family.indexOf(conn), 1);  
    });
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/echo'});
server.listen(9999, '0.0.0.0');

