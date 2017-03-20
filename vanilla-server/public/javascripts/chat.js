var sock = new SockJS('http://127.0.0.1:9999/echo');

function initSock() {

    sock.onopen = function() {
        console.log('init');
        var data = {type: 'INIT', chatId: window.chatId}
        sock.send(JSON.stringify(data));
    };

    sock.onmessage = function(e) {
        console.log(e.data);
        var data = JSON.parse(e.data);



        if(data.type == 'JOIN') {
            // user input
            window.nickname = 'Ricardo';
            var messageBody = {type: 'JOIN', chatId: window.chatId, nickname: window.nickname, connId: data.connId}
            sock.send(JSON.stringify(messageBody));
        }

        if(data.type == 'NOTI-JOIN') {
            sendMsg(data.message, data.type);
        }

        if(data.type == 'NOTI-UNLOAD') {
            console.log(data.message);
        }

        var myMessage = false;
        if(data.connId == window.connId) {
            myMessage = true;
        }

        if(data.type == 'SEND') {
            console.log('message', e.data);
            var chatBoard = $('#chatBoard');
            var messageBox = myMessage ?
                $('div.hidden > .my-message').clone():
                $('div.hidden > .your-message').clone();

            $('p', messageBox).text(data.message);
            $('.name', messageBox).text(data.nickname);
            chatBoard.append(messageBox).append('<br/>');
        }
    };

    //sock.onclose = close;

}

function close() {
    console.log('bye~')
    var messageBody = {type: 'UNLOAD', chatId: window.chatId}
    sock.send(JSON.stringify(messageBody));
    sock.close();
}


function sendMsg(message, type) {
    if(type == 'warn') {
        var chatBoard = $('#chatBoard');
        var message = $('<div class="msg warn">').text(message);
        chatBoard.append(message);
    } else if(type == 'NOTI-JOIN') {
        var chatBoard = $('#chatBoard');
        var message = $('<div class="msg warn">').text(message);
        chatBoard.append(message);
    }
}

$(function() {
    window.chatId = $('#chatId').val();

    window.onbeforeunload = close;


    $('input[name=inpMessage]').keypress(function (event) {
        if(event.which == 13) {
            var message = $('input[name=inpMessage]').val();
            var messageBody = { type: 'SEND', message: message, nickname: window.nickname, chatId: window.chatId};

            sock.send(JSON.stringify(messageBody));
            $('input[name=inpMessage]').val('');
        }
    });


    function timer() {
        var timeout = moment($('#timeout').val());
        var now = moment();
        if(now > timeout) {
            clearInterval(interval);
            sendMsg('char room was closed', 'warn');
            $('input[name=inpMessage]').remove();
            $('#remainTime').text('close after ' + moment.utc(0).format('HH:mm:ss'));
            close();
        } else {
            $('#remainTime').text('close after ' + moment.utc(timeout - now).format('HH:mm:ss'));
        }

    }

    var interval = setInterval(timer, 1000);


    initSock();
});
