var express = require('express');
var router = express.Router();
var udpCommander = require('../socket');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET control page */
router.get('/control', function(req, res, next) {
  res.render('control');
});

/* GET play cmd */
router.get('/play', function(req,res,next) {
  udpCommander.sendUdpCommand("play");  
});

router.get('/pause', function(req, res, next) {
  udpCommander.sendUdpCommand("pause");
});

module.exports = router;
