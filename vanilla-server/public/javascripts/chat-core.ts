import * as SockJS from 'sockjs-client';
import * as moment from 'moment';
import * as $ from 'jquery';


var sock = new SockJS('http://172.27.68.53:9999/echo');

var chatId: string;
var nickname: string;
var connId: string;

export function init(_chatId: string, timeout: string) {
    chatId = _chatId;
    initSock();

    function timer(_timeout: string) {
        let timeout: any = moment(_timeout);
        let now: any = moment();
        if(now > timeout) {
            console.log('>> timeouted');
            clearInterval(interval);
            //$('#remainTime').text('close after ' + moment.utc(0).format('HH:mm:ss'));
            send({type: 'timeout'});
            sock.close();
        } else {
            //$('#remainTime').text('close after ' + moment.utc(timeout - now).format('HH:mm:ss'));
        }

    }

    let interval = setInterval(timer.bind(null, timeout), 1000);

}




window.onload = function() {

    $('input[name=inp-text]').keypress(function(e) {
        if(e.which == 13) {
            var message = $('input[name=inp-text]').val();
            if(message) { send({type: 'send', message: message}); }
            $('input[name=inp-text]').val('');
        }
    });

}


enum Types {
    init, join, joinNoti, unload, unloadNoti, send, timeout
}

interface MessageBody {
    readonly type: string;
    readonly message?: string;
    chatId?: string;
    connId?: string;
    nickname?: string;
}


let send = function(obj: MessageBody) {
    obj.chatId = chatId;
    obj.nickname = nickname;
    obj.connId = connId;
    sock.send(JSON.stringify(obj));
}

let updateUserList = function(userList: any[]) {
    $('.userList').empty();
    userList.forEach(function(user) {
        $('.userList').append(`<span class="tag is-dark user-tag">${user.nickname}</span>`);
    });
}

let messageHandler =  {
    join: function(data) {
        console.log('>> join');
        console.log(data);
        connId = data.connId;
        send({type:Types[Types.join]})
    },

    notiJoin: function(data) {
        console.log('>> notiJoin');
        console.log(data);
        updateUserList(data.userList);
    },

    notiUnload: function(data) {
        console.log('>> notiUnload');
        console.log(data);
        updateUserList(data.userList);
    },

    send: function(data) {
        console.log('>> send');
        console.log(data);
        if(data.connId == connId) {
            $('.message-list .column').append(`
                <div class="message-parent my-message"><div class="message-container my-message">
                    <div class="name"></div>
                    <div class="talk-bubble tri-right right-in round">
                        <div class="talktext">${data.message}</div></div></div>`);
        } else {
            $('.message-list .column').append(`
                <div class="message-parent"><div class="message-container not-my-message">
                    <div class="name"></div>
                    <div class="talk-bubble tri-right left-in round">
                        <div class="talktext">${data.message}</div></div></div>`);
        }

        scrollDown();
    }

}

let scrollDown = function () {
    window.scrollTo(0,document.body.scrollHeight);
}

let sockHandlers = {
    onopen: function(): void {
        console.log('>> init');
        nickname = getNickname();
        send({type: Types[Types.init]});
        $('.nav-nickname').text(nickname);
    },

    onmessage: function(res): void {
        let data = JSON.parse(res.data);
        let handler = messageHandler[data.type];
        handler(data);
    },

    onclose: function(): void {
        console.log('>> connection closed');
    }

}


function initSock(): void {
    sock.onopen = sockHandlers.onopen;
    sock.onmessage = sockHandlers.onmessage;
    sock.onclose = sockHandlers.onclose;
}


function getNickname(): string {
    let nickname = localStorage.getItem('nickname');
    let names: string[] = [
        'Rory McIlroy', 'Jason Day', 'Hideki Matsuyama'
        ,'Henrik Stenson', 'Jordan Spieth', 'Justin Thomas'
        ,'Adam Scott', 'Rickie Fowler', 'Sergio Garcia'
        ,'Alex Noren', 'Patrick Reed', 'Justin Rose'
        ,'Tyrrell Hatton', 'Danny Willett', 'Paul Casey'
        ,'Bubba Watson', 'Phil Mickelson', 'Branden Grace'
        ,'Matt Kuchar', 'Russell Knox', 'Jimmy Walker'
        ,'Brandt Snedeker', 'Brooks Koepka', 'Jon Rahm'];

    return nickname ? nickname : names[Math.floor(Math.random() * names.length)];
}


function close() {
    console.log('bye');
    send({type: 'unload'});
}
if('onbeforeunload' in window) {
    window.onbeforeunload = close;
} else {
    window.onunload = close;
}
