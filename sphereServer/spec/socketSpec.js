var io = require('socket.io-client');
var db = require('../db');

var server = "http://localhost:8080/"

describe("Socket Module", function() {
    console.log("\n");
    console.log("Testing Socket Module");
    console.log("=====================");

    afterEach((done) => {
        db.clearTable(function(err, result) {
            expect(err).toBeFalsy();
            done();
        });
    });

    describe("Initial Connection", function() {
        console.log("\t[+]Testing initial connection");
        it("should respond with position number -1", function(done) {
            let socket = io(server,{});
            socket.on('connect', function() {
                //console.log("CONNECTED");
            });
            socket.on('pos', function(data) {
                expect(data).toEqual(-1);
                socket.close();
                done();
            });
        });
    });

    describe("Update Position", function() {
        console.log("\t[+]Testing update position");
        it("should respond with new position number", function(done) {
            let socket = io(server,{});
            let newPosition = 666;

            socket.on('connect', function() {
                //console.log("CONNECTED");
            });
            socket.emit('register position', newPosition);
            socket.on('newpos', function(newData) {
                expect(newData).toEqual(newPosition);
                socket.close();
                done();
            });
        });
    });
});

