require('dotenv').config();

var db = require('../db');

db.useTestDatabase();

describe("Database Module", function() {
    console.log("\n");
    console.log("Testing Database Module");
    console.log("=======================");

    // In case test suite crashed last time
    db.clearTable(function(err, result) {
        expect(err).toBeFalsy();
    });

    var testPhones = [
        {socketId: "111", ipAddress: "111.111.111.111"},
        {socketId: "222", ipAddress: "222.222.222.222"},
        {socketId: "333", ipAddress: "333.333.333.333"},
        {socketId: "444", ipAddress: "444.444.444.444"},
        {socketId: "555", ipAddress: "555.555.555.555"},
    ];

    beforeEach(function(done) {

        testPhones.forEach(function(phone) {
            db.createPhone(phone.ipAddress, phone.socketId, function(err, result) {
                expect(err).toBeFalsy();
                if(testPhones.indexOf(phone) === testPhones.length-1) {
                    done();
                }
            });
        });
    });

    afterEach(function(done) {

        db.clearTable(function(err, result) {
            expect(err).toBeFalsy();
            done();
        });
    });

    describe("Create Phone", function() {
        console.log("\t[+]Testing Create Phone");

        var testSocketId = "777";
        var testIpAddress = "777.777.777.777";

        it("should insert new phone in database", function(done) {
            db.createPhone(testIpAddress, testSocketId, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].socketid).toEqual(testSocketId);
                expect(result.rows[0].ipaddress).toEqual(testIpAddress);
                done();
            });
        });
    });

    describe("Get Phones", function() {
        console.log("\t[+]Testing Get Phones");

        it("should return all phones in database", function(done) {
            db.getPhones(function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows.length).toEqual(testPhones.length);
                done();
            });
        });
    });

    describe("Get Phone", function() {
        console.log("\t[+]Testing Get Phone");

        let testPhone = testPhones[2];
        it("should return phone data given IP address", function(done) {
            db.getPhone(testPhone.ipAddress, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].ipaddress).toEqual(testPhone.ipAddress);
                expect(result.rows[0].position).toEqual(-1); // Always new
                done();
            });
        });
    });

    describe("Update Phone Position", function() {
        console.log("\t[+]Testing Update Phone Position");

        let testPhone = testPhones[0];
        let newPosition = 999;
        it("should update saved phone position given IP address", function(done) {
            db.updatePhonePosition(testPhone.ipAddress, newPosition, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].ipaddress).toEqual(testPhone.ipAddress);
                expect(result.rows[0].position).toEqual(newPosition);
                done();
            });
        });
    });

    describe("Update Phone Socket ID", function() {
        console.log("\t[+]Testing Update Phone Socket ID");

        let testPhone = testPhones[4];
        let newSocketId = "teststring";
        it("should update saved phone socket ID given IP address", function(done) {
            db.updatePhoneSocketId(testPhone.ipAddress, newSocketId, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].ipaddress).toEqual(testPhone.ipAddress);
                expect(result.rows[0].socketid).toEqual(newSocketId);
                done();
            });
        });
    });

    describe("Delete Phone", function() {
        console.log("\t[+]Testing Delete Phone");

        let ipAddress = testPhones[0].ipAddress;
        it("should delete a phone from database given its IP address", function(done) {
            db.deletePhone(ipAddress, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rowCount).toEqual(1);
                done();
            });
        });
    });
});

