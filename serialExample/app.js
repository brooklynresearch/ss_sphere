var express = require('express')
var path = require('path');
//var SerialPort = require('serialport')

var app = express()
var encoderController = require('./routes/encoderController');

var serialServer = require('./serialServer').SerialServer;
 
/*
var port = new SerialPort("/dev/tty.usbmodem1612621", function (err) {
  if (err) {
    return console.log('Error: ', err.message);
  }
  port.write('STAT\r\n', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });
  baudRate: 115200
  parser: SerialPort.parsers.readline('\n')
});
*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', encoderController);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
  
  serialServer.on('serial', data =>{
  	console.log('got serial');
  	var status = JSON.parse(data);
  	console.log(status);

  })

  /*
  port.on('data', function (data) {
  	if(checkDataSize(data) > 20){
  		var status = JSON.parse(data);
  		console.log(status);
  	} else {
	  	console.log('Data: ' + data);
	}
  })
  */
})

var checkDataSize = function(obj){
	var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};