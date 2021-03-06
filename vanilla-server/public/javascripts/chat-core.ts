import * as SockJS from 'sockjs-client';
import * as moment from 'moment';
import * as $ from 'jquery';
import * as Clipboard from 'clipboard';
import * as linkify from 'linkifyjs';
import * as linkifyHtml from 'linkifyjs/html';

var sock = null;

var chatId: string;
var nickname: string;
var connId: string;

export function init(_chatId: string, timeout: string) {
    chatId = _chatId;
    //sock = new SockJS('http://127.0.0.1:9999/echo', null, {sessionId: function() {
    sock = new SockJS('https://vanilla-sockjs.herokuapp.com/echo', null, {sessionId: function() {
        return new Date().getTime() + "_" + chatId;
    }});
    initSock();

    function timer(_timeout: string) {
        let timeout: any = moment(_timeout);
        let now: any = moment();
        if(now > timeout) {
            console.log('>> timeouted');
            clearInterval(interval);
            displayTimeout(0, 0);
            disableTextInput();
            send({type: 'timeout'});
            sock.close();
        } else {
            displayTimeout(timeout, now);
        }

    }

    let interval = setInterval(timer.bind(null, timeout), 1000);

}


let displayTimeout = function(timeout, now): void {
    if(timeout == 0) {
        $('.message-list .column').append(`
            <div class="message-parent">
                <div class="message-container">
                    <div class="noti-message">chat timeouted</div></div></div>`);

    }

    let remain = moment.utc(timeout - now);
    $('.timeout-banner').text(remain.format('HH:mm:ss'));
    $('.timeout-in-message').text(remain.format('HH:mm:ss'));

    if(remain.subtract(1, 'minutes') < moment(0)) {
        $('.timeout-banner').addClass('red');
    }

    
}


let disableTextInput = function(): void {
    $('input[name=inp-text]').prop('disabled', true);
}

window.onload = function() {

    $('input[name=inp-text]').prop('disabled', true);

    function clickSend() {
        var message = $('input[name=inp-text]').val();
        if(message) { send({type: 'send', message: message}); }
        $('input[name=inp-text]').val('');

    }

    $('input[name=inp-text]').keypress(function(e) {
        if(e.which == 13) {
            clickSend();
        }
    });

    $('a[name=btn-send]').click(function(e) {
        clickSend();
    })

    $('a[name=btn-nickname]').click(function(e) {
        start();
    })

    $('input[name=inp-clipboard]').val(window.location.href);

    $('#nav-toggle').click(function(e) {
        if($(this).hasClass('is-active')) {
            $(this).removeClass('is-active')
            $('.nav-menu').removeClass('is-active')
        } else {
            $(this).addClass('is-active')
            $('.nav-menu').addClass('is-active')
        }
    });

    $('#nav-about').click(function() {

    });

    new Clipboard('.btn-copy');
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
    $('.userItem').empty();
    userList.forEach(function(user) {
        $('.userItem').append(`<span class="tag is-dark user-tag">${user.nickname}</span>`);
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

        if(data.connId != connId) {
            $('.message-list .column').append(`
                <div class="message-parent">
                    <div class="message-container">
                        <div class="noti-message">${data.nickname} joined</div></div></div>`);
        }


        updateUserList(data.userList);
    },

    notiUnload: function(data) {
        console.log('>> notiUnload');
        console.log(data);
        $('.message-list .column').append(`
            <div class="message-parent">
                <div class="message-container">
                    <div class="noti-message">${data.nickname} leaved</div></div></div>`);

        updateUserList(data.userList);
    },

    send: function(data) {
        console.log('>> send');
        console.log(data);
        if(data.connId == connId) {
            $('.message-list .column').append(`
                <div class="message-parent my-message">
                    <div class="message-container my-message">
                        <div class="talk-bubble tri-right right-in round">
                            <div class="talktext">${data.message}</div></div></div></div>`);
        } else {
            $('.message-list .column').append(`
                <div class="message-parent">
                    <div class="balloon-nickname">${data.nickname}</div>
                    <div class="message-container not-my-message">
                        <div class="talk-bubble tri-right left-in round">
                            <div class="talktext">${data.message}</div></div></div></div>`);
        }

        $('.talktext:last').html(linkifyHtml($('.talktext:last').text()));
        scrollDown();
    }

}

let scrollDown = function () {
    window.scrollTo(0,document.body.scrollHeight);
}

let sockHandlers = {
    onopen: function(): void {
        console.log('>> init');
        openHandler();
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


function sendInit(nickname: string): void {
    send({type: Types[Types.init]});
    $('.nickname-modal').removeClass('is-active');
    $('.nickname-in-message').text(nickname);
    $('input[name=inp-text]').prop('disabled', false);

}

function openHandler(): void {
    nickname = localStorage.getItem('nickname');

    if(!nickname) {
        $('.nickname-modal').addClass('is-active');
    } else {
        sendInit(nickname);
    }



}

function start(): void {
    nickname = $('.inp-nickname').val() || getRandomNickname();
    try {
        localStorage.setItem('nickname', nickname);
    } catch(e) {
        // safari does not allow local storage to be used on private browsing
    }
    sendInit(nickname);
}


function getRandomNickname(): string {

    const names: string[] = [
        'Ryu So Yeon' ,'Jutanugarn Ariya' ,'Lee Mirim'
        ,'Jang Ha Na' ,'Nordqvist Anna' ,'Park Inbee'
        ,'Lincicome Brittany' ,'Yang Amy' ,'Ernst Austin'
        ,'Lewis Stacy' ,'Thompson Lexi' ,'Chun In Gee'
        ,'Park Sung Hyun' ,'Jutanugarn Moriya' ,'Piller Gerina'
        ,'Rory McIlroy', 'Jason Day', 'Hideki Matsuyama'
        ,'Henrik Stenson', 'Jordan Spieth', 'Justin Thomas'
        ,'Adam Scott', 'Rickie Fowler', 'Sergio Garcia'
        ,'Alex Noren', 'Patrick Reed', 'Justin Rose'
        ,'Tyrrell Hatton', 'Danny Willett', 'Paul Casey'
        ,'Bubba Watson', 'Phil Mickelson', 'Branden Grace'
        ,'Matt Kuchar', 'Russell Knox', 'Jimmy Walker'
        ,'Brandt Snedeker', 'Brooks Koepka', 'Jon Rahm'];

    return names[Math.floor(Math.random() * names.length)];
}

