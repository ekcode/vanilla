var express = require('express');
var router = express.Router();
var moment = require('moment');
var uuidV4 = require('uuid/v4');
var redis = require('redis');

var db = redis.createClient();

router.post('/', function(req, res, next) {
    const uuid = uuidV4().substr(0, 5);
    req.chatId = uuid;
    db.set('chat_' + uuid, '[]');
    next();
}, function(req, res) {
    res.redirect('/c/' + req.chatId);
});

module.exports = router;
