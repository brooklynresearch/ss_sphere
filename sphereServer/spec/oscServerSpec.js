var io = require('socket.io-client');
var osc = require('osc');

describe("OSC Server Class", function() {
    console.log("\n");
    console.log("Testing OSC Server");
    console.log("==================");

    var server = "http://localhost:8080/"
    var oscClient;
    var socket;

    beforeEach(() => {
        // OSC SENDER
        oscClient = new osc.UDPPort({
            localAddress: '0.0.0.0',
            localPort: 57122,
            remoteAddress: '127.0.0.1',
            remotePort: 12345
        });
        // WEBSOCKET LISTENER
        socket = io(server,{});
        socket.on('connect',function() {
            // need socket connection first
            oscClient.open();
        });
    });

    describe("Recieve Encoder Value", () => {
        console.log("\t[+]Testing Encoder Value Forwarding");
        it("should recieve value over osc and forward to websockets", function(done) {

            let testValue = 999;

            // Send new rotary value over OSC
            oscClient.on("ready", function() {
                oscClient.send({
                    address: '/rotary',
                    args: [{
                        type: 'i',
                        value: testValue
                      }]
                  });
            });

            // Listen on websocket for new rotary value
            socket.on('rotate', function(data) {
                expect(data).toEqual(testValue);
                socket.close();
                done();
            });
        });
    });
});

