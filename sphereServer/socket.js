var db = require('./db');
var dgram = require('dgram');

db.useTestDatabase();

var udpBroadcaster;

var startListeners = function(io) {

    // var oscServer = require('./oscServer').OscServer;
    var serialServer = require('./serialServer').SerialServer;

    udpBroadcaster = dgram.createSocket('udp4');
    let broadcast = process.env.BROADCAST_ADDR;

    // oscServer.on('osc', (oscMessage) => {
    //     let encoderValue = oscMessage.args[0];
    //     console.log("UDP BROADCAST: ", encoderValue);
    //     udpBroadcaster.send(encoderValue.toString(), 55555, '192.168.1.255', (err) => {
    //         if (err) {
    //             console.log("ERROR on broadcast: ", err);
    //         }
    //     });
    // });

    serialServer.on('serial', (data) => {
        console.log("got serial");
        console.log(data);
        let encoderValue = data;
        console.log("UDP BROADCAST: ", encoderValue);
        udpBroadcaster.send(encoderValue.toString(), 55555, broadcast, (err) => {
            if (err) {
                console.log("ERROR on broadcast: ", err);
            }
        });
    });

    udpBroadcaster.on('listening', () => {
      let address = udpBroadcaster.address();
        udpBroadcaster.setBroadcast(true);
      console.log(`Broadcaster Running ${address.address}:${address.port}`);
    });

    udpBroadcaster.bind({
        address: process.env.MACHINE_IP,
        port: 41234}
    );

    io.on('connection', function(socket) {
        let ipAddress = socket.request.connection.remoteAddress;
        db.getPhone(ipAddress, function(err, result) {
            if(result.rows.length === 0) {
                db.createPhone(ipAddress, socket.id, function(err, result) {
                    socket.emit('pos', result.rows[0].position);
                });
            } else {
                socket.emit('pos', result.rows[0].position);
            }
        });

        socket.on('register position', function(msg) {
            let pos = msg;
            db.updatePhonePosition(ipAddress, pos, function(err, result) {
                socket.emit('newpos', result.rows[0].position);
            });
            console.log("position: " + pos);
        });

        socket.on('error', function(err) {
            console.log("Socket Error: ", err.message);
            socket.disconnect(true);
        });

        // controller has set a new video
        socket.on('set video', function(msg) {
            console.log("set video");

            // set an internal variable to this new set video if it is new

            // emit this to all the devices in order to tell them to play
            io.emit('switch video', msg);

        });
    });
}

var sendUdpCommand = function(cmd) {
    let broadcast = process.env.BROADCAST_ADDR;
    for( var i = 0; i < 10; i++) {
        console.log("Sending Command: ", cmd);
        udpBroadcaster.send(cmd, 55555, broadcast, (err) => {
            if (err) {
                console.log("ERROR on Send Udp Command: ", err);
            }
        });
    }
}

module.exports = {
    startListeners: startListeners,
    sendUdpCommand: sendUdpCommand
}

