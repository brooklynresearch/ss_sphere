var Client = require('pg').Client;
var squel = require('squel').useFlavour('postgres');

var dbClient;

var connect = function() {
    dbClient = new Client(process.env.DATABASE_URL);
    dbClient.connect((error) => {
        if (error) {
            console.log("ERROR: Could not connect to database!", error.message);
        }
    });
}

var useTestDatabase = function() {
    dbClient = new Client(process.env.TEST_DATABASE_URL);
    dbClient.connect( function(error) {
        if (error) {
            console.log("ERROR: Could not connect to test database!", error.message);
        }
    });
}

var createPhone = function(position, ipAddress, cb) {
    var query = squel.insert()
                .into("phones")
                .set("position", position)
                .set("ipaddress", ipAddress)
                .returning('*')
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: inserting phone ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var deletePhone = function(phoneId, cb) {
    var query = squel.delete()
                .from("phones")
                .where("id = ?", phoneId)
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: deleting phone ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var disconnect = function() {
    dbClient.end();
}

module.exports = {
    connect: connect,
    useTestDatabase: useTestDatabase,
    createPhone: createPhone,
    deletePhone: deletePhone,
    disconnect: disconnect
}

