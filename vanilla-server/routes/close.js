var express = require('express');
var router = express.Router();

router.post('/:chatId', function(req, res, next) {
    console.log(req.params.chatId);
    console.log(req.body.sessionId);
    res.send(JSON.stringify({message: 'Bye!', type: 'NOTI'}));
});

module.exports = router;
