var express = require('express');
var router = express.Router();
var socketCmd = require('../socket');
var fs = require('fs');

var showPos = false;
var displayDark = false;

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
  console.log("play");
  //socketCmd.sendUdpCommand("play");  
  socketCmd.sendSocketBroadcast('toggle-play', {timestamp: Date.now(), delay: 2000});
  res.end();
});

router.get('/test-stream', function(req, res, next) {
    console.log("stream");
    socketCmd.streamVideo();
    res.end();
})

router.get('/pause', function(req, res, next) {
    console.log("pause");
    //socketCmd.sendUdpCommand("pause");
    socketCmd.sendSocketBroadcast('pause', 0);
    res.end();
});

router.get('/sendparams', function(req, res, next) {

  //console.log("IN sendparams");
  fs.readFile('./public/positions.json', 'utf8', function(err, data) {
      if (err) {
          console.log("couldn't Open positions file!: ", err);
      } else {
          console.log("Sending Position Table");
          let jsonData = JSON.parse(data);
          socketCmd.sendSocketBroadcast('newtable', jsonData);
      }
  });
  res.end();
});

router.get('/hidedebug', function(req, res, next) {
  showPos = !showPos;
  console.log('showPos: ', showPos);
  socketCmd.sendSocketBroadcast('hidedebug', showPos);
  res.end();
});

router.get('/dark', function(req, res, next) {
  displayDark = !displayDark;
  console.log('displayDark: ', displayDark);
  socketCmd.sendSocketBroadcast('dark', displayDark);
  res.end();
});

router.get('/reload', function(req, res, next) {
  console.log("reload");
  socketCmd.sendSocketBroadcast('reload', 0);
  res.end();
});

router.get('/sleep', function(req, res, next) {
    console.log("Sending sleep command", req.query);
    socketCmd.sendSocketBroadcast('sleep', req.query.time);
    res.end();
});

router.get('/update-apk', function(req, res, next) {
    console.log("Sending update-apk command", req.query);
    socketCmd.sendSocketBroadcast('update-apk');
    res.end();
});

module.exports = router;

