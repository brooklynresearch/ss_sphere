var events = require('events')
var SerialPort = require('serialport')

class SerialServer extends events.EventEmitter {
    constructor() {
        super();
        // Serial port module
        var port = new SerialPort("/dev/ttyACM0", function (err) {
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


        port.on('data', (data) => {
            console.log('Got Serial: ' + data);
            this.setMaxListeners(0);
            this.emit('serial', data);
        });
    }
}

module.exports.SerialServer = new SerialServer;

