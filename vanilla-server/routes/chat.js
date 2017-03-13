var express = require('express');
var router = express.Router();
var moment = require('moment');
var redis = require('redis');

var db = redis.createClient();

router.get('/:chatId', function(req, res, next) {
    db.get('chat_' + req.params.chatId, function (err, reply) {
        console.log('### ' + reply);
        if(reply) {
            res.render('chat', { chatId: req.params.chatId, closeAt: '2017-03-12T19:55:12+09:00' });
        } else {
            res.redirect('/');
        }

    });
});

module.exports = router;

