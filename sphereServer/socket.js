var db = require('./db');
var dgram = require('dgram');
var fs = require('fs');

db.connect();

var udpBroadcaster;
var ioInstance;

var startListeners = function(io) {

    console.log("Starting listeners");

    ioInstance = io;
    var serialServer = require('./serialServer').SerialServer;

    udpBroadcaster = dgram.createSocket('udp4');
    let broadcast = process.env.BROADCAST_ADDR;

    serialServer.on('serial', (data) => {
        console.log("got serial", data);
        console.log("value: ", data.toString());
        //let encoderValue = 39000 - data;
        udpBroadcaster.send(data.toString(), 55555, broadcast, (err) => {
            console.log("UDP BROADCAST: ", data.toString());
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

        sendParamsFile();

        db.getFiles((err, result) => {
            if (err) {
                console.log("Error reading file table: ", err.message);
            } else {
                let jsonData = result.rows.map(function(r) {
                    return {id: r.id, name: r.name, dir: r.dir, active: r.active, selected: r.selected, size: r.size}
                });
                console.log("Sending File List");
                socket.emit('filelist', jsonData);
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
        //var dark = false;
        socket.on('set media', function(msg) {
            console.log("set media", msg);
            if (msg.name === 'black screen') {
                //dark = !dark
                //if (dark){
                    sendSocketBroadcast("dark", "true");
                    //sendUdpCommand("f"+"-0");
                //} else {
                    //sendSocketBroadcast("dark", "false");
                    //sendUdpCommand("f"+"+0");
                //}
            } else {
                if (msg.type === "Images") {
                    io.emit("load-image", {"name": msg.name});
                } else if (msg.type === "Videos") {
                    io.emit("load-video", {"name": msg.name});
                }
                // set an internal variable to this new set video if it is new
                // var delay = 30000;
                // emit this to all the devices in order to tell them to play
                // io.emit('switch video', msg);
                //io.emit('frame', msg);
                //sendUdpCommand("f"+msg);
                // setTimeout(function() {
                //     sendUdpCommand('play');
                // }, delay);
            }
        });
        socket.on('newfile', function(url) {
            console.log("sending URL: ", url);
            sendSocketBroadcast("file", url);
            //socket.emit('ACK', 'newfile');
        });
    });
}

var sendSocketBroadcast = function(sockEvent, msg) {
    //console.log("sending params");
    ioInstance.emit(sockEvent, msg);
}

var sendParamsFile = function() {
    fs.readFile('./public/parameters.json', 'utf8', function(err, data) {
        if (err) {
            console.log('Error opening file!: ', err);
        } else {
            console.log('Sending Position Table');
            let jsonData = JSON.parse(data);
            ioInstance.emit('newtable', jsonData);
        }
    });
}

var sendUdpCommand = function(cmd) {
    let broadcast = process.env.BROADCAST_ADDR;
    for( var i = 0; i < 10; i++ ) {
        setTimeout(() => {
            console.log("Sending Command: ", cmd);
            udpBroadcaster.send(cmd, 55555, broadcast, (err) => {
                if (err) {
                    console.log("ERROR on Send Udp Command: ", err);
                }
            });
        }, 5);
    }
}

var stop = function() {
    ioInstance.close();
}

module.exports = {
    startListeners: startListeners,
    sendUdpCommand: sendUdpCommand,
    sendSocketBroadcast: sendSocketBroadcast,
    sendParamsFile: sendParamsFile,
    stop: stop
}

