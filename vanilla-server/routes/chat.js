var express = require('express');
var router = express.Router();
var moment = require('moment');

router.get('/:chatId', function(req, res, next) {
    console.log(req.params.chatId);
    res.render('chat', { chatId: req.params.chatId, closeAt: '2017-03-10T15:55:12+09:00' });
});

module.exports = router;
