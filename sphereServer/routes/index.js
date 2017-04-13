var express = require('express');
var router = express.Router();
var socketCmd = require('../socket');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET control page */
router.get('/moviecontrol', function(req, res, next) {
  res.render('moviecontrol');
});

/* GET play cmd */
router.get('/play', function(req,res,next) {
  socketCmd.sendUdpCommand("play");  
  res.end();
});

router.get('/pause', function(req, res, next) {
  socketCmd.sendUdpCommand("pause");
  res.end();
});

router.get('/sendparams', function(req, res, next) {

    console.log("IN sendparams");

    let jsonData = require('../pos-generator').generateParams();
    //console.log('Sending Params ', jsonData);

    socketCmd.sendSocketBroadcast('params', jsonData);

    //res.setHeader('Content-Type', 'application/json');
    //res.send(JSON.stringify(jsonData));
});

module.exports = router;

