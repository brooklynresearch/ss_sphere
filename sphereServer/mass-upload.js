require('dotenv').config();

// SOCKET IO
var client = require('socket.io-client');

var addr = "http://" + process.env.MACHINE_IP;
var socket = client(addr + ":8080");

socket.on('connect', function() {
    socket.emit('newfile', addr + ":3000" + process.argv[2]);
});
socket.on('ACK', function() {
    socket.disconnect();
});
socket.on('disconnect', function() {
    process.exit();
});

