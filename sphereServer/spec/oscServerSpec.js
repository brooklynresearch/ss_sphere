var io = require('socket.io-client');
var osc = require('osc');

var server = "http://localhost:8080/"

describe("Osc Server Class", function() {
    console.log("\n");
    console.log("Testing OSC Server");
    console.log("==================");

    beforeEach(() => {

    }

    describe("Send Encoder Value", () => {
        console.log("\t[+]Testing Send Encoder Value");
        it("should send osc value to websockets", function(done) {

            let testValue = 999;

            // OSC SENDER
            let oscClient = new osc.UDPPort({
                localAddress: '0.0.0.0',
                localPort: 57122,
                remoteAddress: '127.0.0.1',
                remotePort: 57121
            });

            oscClient.on("ready", function() {
                console.log("sending");
                oscClient.send(
                  {
                    address: '/osc',
                    args: [
                      {
                        type: 'i',
                        value: testValue
                      }
                     ]
                  });
            });

            // WEBSOCKET LISTENER
            let socket = io(server,{});
            socket.on('connect',function() {
                console.log("connected");
                oscClient.open();
            });
            socket.on('rotate', function(data) {
                expect(data).toEqual(testValue);
                socket.close();
                done();
            });
        });
    });
});

