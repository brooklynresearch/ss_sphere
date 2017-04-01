var request = require("request");

var base_url = "http://localhost:3000/"

describe("Server Routes", function() {

    describe("GET /", function() {
        it("Responds status code 200", function(done) {
            request.get(base_url, function(error, response, body) {
                expect(error).toBeFalsy();
                expect(response.statusCode).toBe(200);
                expect(response).not.toBe(undefined);
                done();
            });
        });
    });
});
