var express = require('express');
var router = express.Router();
var fs = require('fs');

var serialServer = require('../serialServer').SerialServer;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('encoder_control', { title: 'Encoder Controller' });
});

/* send encoder timing */
router.get('/time', function(req,res,next) {
  console.log("time");
  var newTiming = req.query.time;
  var command = "TIME " + newTiming +"\r\n";
  console.log(command)
  serialServer.sendCommand(command);
  res.end();
});

/* send encoder timing */
router.get('/sens', function(req,res,next) {
  console.log("sensitivity");
  var newResolution = req.query.sens;
  var command = "SENS " + newResolution +"\r\n";
  console.log(command)
  serialServer.sendCommand(command); 
  res.end();
});

/* send encoder timing */
router.get('/max', function(req,res,next) {
  console.log("max steps");
  var newMaxSteps = req.query.max;
  var command = "MAX " + newMaxSteps +"\r\n";
  console.log(command)
  serialServer.sendCommand(command);
  res.end();
});

/* send encoder timing */
router.get('/getstatus', function(req, res, next) {
  console.log("getting Status");
  var command = "STAT\r\n"
  serialServer.sendCommand(command);
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
            //socketCmd.sendSocketBroadcast('newtable', jsonData);
        }
    });
    res.end();
});

module.exports = router;

