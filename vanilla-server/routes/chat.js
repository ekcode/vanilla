var express = require('express');
var router = express.Router();
var moment = require('moment');
var redis = require('redis');

var db = redis.createClient('redis://h:p8dff5fb6823f11f843e975a45135dc5d518994ea6cf663333f4286eb79322349@ec2-34-206-56-163.compute-1.amazonaws.com:9769');

router.get('/:chatId', function(req, res, next) {
    db.get('chat_' + req.params.chatId, function (err, reply) {
        if(reply) {
            db.get('timeout_' + req.params.chatId, function (err, timeout) {
                console.log(moment() < moment(timeout));
                if(moment() < moment(timeout)) {
                    res.render('chat', { chatId: req.params.chatId, timeout: timeout });
                } else {
                    res.redirect('/');
                }
            });
        } else {
            res.redirect('/');
        }
    });
});

module.exports = router;
