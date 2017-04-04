var express = require('express');
var router = express.Router();
var moment = require('moment');
var uuidV4 = require('uuid/v4');
var redis = require('redis');

var db = redis.createClient('redis://h:p8dff5fb6823f11f843e975a45135dc5d518994ea6cf663333f4286eb79322349@ec2-34-206-56-163.compute-1.amazonaws.com:9769');

router.post('/', function(req, res, next) {
  const uuid = uuidV4().substr(0, 5);
  req.chatId = uuid;
  var h = req.body.timeHours;
  var m = req.body.timeMinutes;
  var s = req.body.timeSeconds;
  db.set('chat_' + uuid, '[]');
  db.set('timeout_' + uuid,
      moment()
      .add(h, 'hours')
      .add(m, 'minutes')
      .add(s, 'seconds')
      .format());
  next();
}, function(req, res) {
  res.redirect('/c/' + req.chatId);
});

module.exports = router;
