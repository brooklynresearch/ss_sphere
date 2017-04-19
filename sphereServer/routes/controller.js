var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('controller', { title: 'Express', vid1: '1492527897971_injected.mp4', vid2: '1492527897977_injected.mp4', vid3: '1492527897978_injected.mp4' });
});

module.exports = router;
