require('dotenv').config();

var db = require('../db');

db.useTestDatabase();

describe("Database Module", function() {
    console.log("\n");
    console.log("Testing Database Module");
    console.log("=======================");

    describe("Phone Data Functions", function() {
        // In case test suite crashed last time
        db.clearPhones(function(err, result) {
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

            db.clearPhones(function(err, result) {
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
                    expect(result.rows[0].position).toEqual('-1'); // Always new
                    done();
                });
            });
        });

        describe("Update Phone Position", function() {
            console.log("\t[+]Testing Update Phone Position");

            let testPhone = testPhones[0];
            let newPosition = "999";
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

    describe("File Data Functions", function() {
        // In case test suite crashed last time
        db.clearFiles(function(err, result) {
            expect(err).toBeFalsy();
        });

        var testFiles = [
            {name: "testfile1", size: 111, isActive: false},
            {name: "testfile2", size: 222, isActive: false},
            {name: "testfile3", size: 333, isActive: false},
            {name: "testfile4", size: 444, isActive: false},
            {name: "testfile5", size: 555, isActive: false},
        ];

        beforeEach(function(done) {

            testFiles.forEach(function(file) {
                db.createFile(file.name, file.size, file.isActive, function(err, result) {
                    expect(err).toBeFalsy();
                    if(testFiles.indexOf(file) === testFiles.length-1) {
                        done();
                    }
                });
            });
        });

        afterEach(function(done) {

            db.clearFiles(function(err, result) {
                expect(err).toBeFalsy();
                done();
            });
        });

        describe("Create File", function() {
            console.log("\n\t[+]Testing Create File");

            let testName = "testFileX";
            let testSize = 99;
            let isActive = false;

            it("should insert new file in database", function(done) {
                db.createFile(testName, testSize, isActive, function(err, result) {
                    expect(err).toBeFalsy();
                    expect(result.rows[0].name).toEqual(testName);
                    expect(result.rows[0].size).toEqual(testSize);
                    expect(result.rows[0].active).toEqual(isActive);
                    done();
                });
            });
        });


        describe("Get Files", function() {
            console.log("\t[+]Testing Get Files");

            it("should return all file entries in the database", function(done) {
                db.getFiles(function(err, result) {
                    expect(err).toBeFalsy();
                    expect(result.rows.length).toEqual(testFiles.length);
                    done();
                });
            });
        });

        describe("Set Active", function() {
            console.log("\t[+]Testing Set Active");

            let filename = testFiles[0].name;
            it("should update the active status for a given filename", function(done) {
                db.setActive(filename, true, function(err, result) {
                    expect(err).toBeFalsy();
                    expect(result.rows[0].active).toEqual(true);
                    done();
                })
            })
        })

        describe("Delete File", function() {
            console.log("\t[+]Testing Delete File");

            let filename = testFiles[0].name;
            it("should delete a file from database given its IP name", function(done) {
                db.deleteFile(filename, function(err, result) {
                    expect(err).toBeFalsy();
                    expect(result.rowCount).toEqual(1);
                    done();
                });
            });
        });

    });
});

