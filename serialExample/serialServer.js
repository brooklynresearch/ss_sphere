var events = require('events')
var SerialPort = require('serialport')

class SerialServer extends events.EventEmitter {
    constructor() {
        super();
        //console.log(this);
        // Serial port module
        this.port = new SerialPort("/dev/tty.usbmodem1690761",  (err) => {
          if (err) {
            return console.log('Error: ', err.message);
          }
          this.port.write('STAT\r\n', function(err) {
            if (err) {
              return console.log('Error on write: ', err.message);
            }
            console.log('message written');
          });
          baudRate: 115200
          parser: SerialPort.parsers.readline('\n')
        });


        this.port.on('data', (data) => {
            this.setMaxListeners(0);
            this.emit('serial', data);
        });
    }

    sendCommand(data) {
      //console.log(data);
      this.port.write(data);
    }
}

module.exports.SerialServer = new SerialServer;

