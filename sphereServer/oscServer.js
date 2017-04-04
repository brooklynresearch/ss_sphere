var events = require('events')
var osc = require('osc')

class OscServer extends events.EventEmitter {
    constructor() {
        super();
        var udpPort = new osc.UDPPort({
            localAddress: "127.0.0.1",
            localPort: 57121
        });

        udpPort.on("ready", function () {
            console.log("Listening for OSC over UDP.");
        });

        udpPort.on("message", (oscMessage) => {
            console.log("Got OSC message ", oscMessage);
            this.emit('osc', oscMessage);
        });

        udpPort.on("error", function (err) {
            console.log("OSC ERROR: ", err);
        });

        udpPort.open();
    }
}

module.exports.OscServer = new OscServer;

