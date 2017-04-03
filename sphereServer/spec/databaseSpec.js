require('dotenv').config();

var db = require('../db');

db.useTestDatabase();

describe("Database Module", function() {
    console.log("Testing Database Module");
    console.log("=======================");

    var testPhones = [
                {position: 111, ipAddress: "111.111.111.111"},
                {position: 222, ipAddress: "222.222.222.222"},
                {position: 333, ipAddress: "333.333.333.333"},
                {position: 444, ipAddress: "444.444.444.444"},
                {position: -1, ipAddress: "555.555.555.555"},
        ];

    beforeEach(function(done) {

        testPhones.forEach(function(phone) {
            db.createPhone(phone.position, phone.ipAddress, function(err, result) {
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

        var testPosition = 777;
        var testIpAddress = "777.777.777.777";

        it("should insert new phone in database", function(done) {
            db.createPhone(testPosition, testIpAddress, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].position).toEqual(testPosition);
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

    describe("Update Phone Position", function() {
        console.log("\t[+]Testing Update Phone Position");

        let testPhone = testPhones[0];
        let newPosition = 999;
        it("Should update saved phone position given IP adress", function(done) {
            db.updatePhonePosition(testPhone.ipAddress, newPosition, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].ipaddress).toEqual(testPhone.ipAddress);
                expect(result.rows[0].position).toEqual(newPosition);
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

