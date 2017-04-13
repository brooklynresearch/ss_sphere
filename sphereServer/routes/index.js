var express = require('express');
var router = express.Router();
var socketCmd = require('../socket');
var fs = require('fs');

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

module.exports = router;

