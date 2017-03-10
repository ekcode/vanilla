var express = require('express');
var router = express.Router();
var moment = require('moment');
var uuidV4 = require('uuid/v4');

router.post('/', function(req, res, next) {
    const uuid = uuidV4();
    req.chatId = uuid.substr(0, 5);
    next();
}, function(req, res) {
    res.redirect('/c/' + req.chatId);
});

module.exports = router;
