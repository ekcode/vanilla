var sock = new SockJS('http://127.0.0.1:9999/echo');

function send(obj) {
    sock.send(JSON.stringify(obj));
}

function initSock() {

    sock.onopen = function() {
        console.log('init >');
        var names = [
            'Rory McIlroy', 'Jason Day', 'Hideki Matsuyama'
                ,'Henrik Stenson', 'Jordan Spieth', 'Justin Thomas'
                ,'Adam Scott', 'Rickie Fowler', 'Sergio Garcia'
                ,'Alex Noren', 'Patrick Reed', 'Justin Rose'
                ,'Tyrrell Hatton', 'Danny Willett', 'Paul Casey'
                ,'Bubba Watson', 'Phil Mickelson', 'Branden Grace'
                ,'Matt Kuchar', 'Russell Knox', 'Jimmy Walker'
                ,'Brandt Snedeker', 'Brooks Koepka', 'Jon Rahm'];

        var nickname = names[Math.floor(Math.random() * names.length)];
        var messageBody = {type: 'INIT', chatId: window.chatId, nickname: nickname}
        send(messageBody);
    };

    sock.onmessage = function(e) {
        var data = JSON.parse(e.data);

        if(data.type == 'JOIN') {
            // variable for checking me.
            window.nickname = data.nickname;
            window.connId = data.connId;
            var messageBody = {type: 'JOIN', chatId: window.chatId, nickname: data.nickname, connId: data.connId}
            send(messageBody);
        }

        if(data.type == 'NOTI-JOIN') {
            console.log('noti-join > ' + e.data);
            var chatBoard = $('#chatBoard');
            var message = $('<div class="msg warn">').text(message);
            chatBoard.append(message);
        }

        if(data.type == 'NOTI-UNLOAD') {
            console.log('noti-unload' + e.data);
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

    sock.onclose = function () {
    }

}


$(function() {
    window.chatId = $('#chatId').val();
    window.onbeforeunload = function() {
        var messageBody = {type: 'UNLOAD', chatId: window.chatId, connId: window.connId};
        send(messageBody);
    };

    $('input[name=inpMessage]').keypress(function (event) {
        if(event.which == 13) {
            var message = $('input[name=inpMessage]').val();
            var messageBody = {type: 'SEND', message: message, nickname: window.nickname, chatId: window.chatId};

            send(messageBody);
            $('input[name=inpMessage]').val('');
        }
    });


    function timer() {
        var timeout = moment($('#timeout').val());
        var now = moment();
        if(now > timeout) {
            clearInterval(interval);
            console.log('char room was timeouted.');
            $('input[name=inpMessage]').remove();
            $('#remainTime').text('close after ' + moment.utc(0).format('HH:mm:ss'));
            var messageBody = {type: 'TIMEOUT', chatId: window.chatId}
            sock.send(JSON.stringify(messageBody));
            sock.close();
        } else {
            $('#remainTime').text('close after ' + moment.utc(timeout - now).format('HH:mm:ss'));
        }

    }

    var interval = setInterval(timer, 1000);

    initSock();
});
