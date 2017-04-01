require('dotenv').config();

var db = require('../db');

db.useTestDatabase();

describe("Database Module", function() {
    var testPosition = 666;
    var testIpAddress = "666.666.666.666";
    var phoneId;

    describe("Create Phone", function() {
        it("should insert new phone in database", function(done) {
            db.createPhone(testPosition, testIpAddress, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rows[0].position).toEqual(testPosition);
                expect(result.rows[0].ipaddress).toEqual(testIpAddress);
                phoneId = result.rows[0].id;
                done();
            });
        });
    });

    describe("Delete Phone", function() {
        it("should delete a phone from database", function(done) {
            db.deletePhone(phoneId, function(err, result) {
                expect(err).toBeFalsy();
                expect(result.rowCount).toEqual(1);
                done();
            });
        });
    });
});

