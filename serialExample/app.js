var express = require('express')
var SerialPort = require('serialport')

var app = express()
var port = new SerialPort("/dev/tty.usbmodem2037431", function (err) {
  if (err) {
    return console.log('Error: ', err.message);
  }
  port.write('main screen turn on', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });
  baudRate: 115200
  parser: SerialPort.parsers.readline('\n')
});

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
  port.on('data', function (data) {
  	console.log('Data: ' + data);
  });
})