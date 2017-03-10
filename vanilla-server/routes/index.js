var express = require('express');
var router = express.Router();
var moment = require('moment');

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
