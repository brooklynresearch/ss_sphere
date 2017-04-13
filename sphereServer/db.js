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

var createPhone = function(ipAddress, socketId, cb) {
    var query = squel.insert()
                .into("phones")
                .set("ipaddress", ipAddress)
                .set("socketid", socketId)
                .set("position", "-1")
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

var getPhones = function(cb) {
    var query = squel.select()
                .from("phones")
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: retrieving phones ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var getPhone = function(ipAddress, cb) {
    var query = squel.select()
                .from("phones")
                .where("ipaddress = ?", ipAddress)
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: retrieving phone ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var updatePhonePosition = function(ipAddress, newPosition, cb) {
    var query = squel.update()
                .table("phones")
                .set("position", newPosition)
                .where("ipaddress = ?", ipAddress)
                .returning('*')
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: updating phone ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var updatePhoneSocketId = function(ipAddress, newPosition, cb) {
    var query = squel.update()
                .table("phones")
                .set("socketid", newPosition)
                .where("ipaddress = ?", ipAddress)
                .returning('*')
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: updating phone ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var deletePhone = function(phoneIpAddress, cb) {
    var query = squel.delete()
                .from("phones")
                .where("ipaddress = ?", phoneIpAddress)
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

var createFile = function(name, url, runtime, cb) {
    var query = squel.insert()
                .into("files")
                .set("name", name)
                .set("url", url)
                .set("runtime", -1)
                .set("active", false)
                .set("selected", false)
                .returning('*')
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: inserting file ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var deleteFile = function(id, cb) {
    var query = squel.delete()
                .from("files")
                .where("id = ?", id)
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: deleting file ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });
}

var getFiles = function(cb) {
    var query = squel.select()
                .from("files")
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: retrieving files ", err.message);
            cb(err, null);
        } else {
            cb(null, result);
        }
    });

}

var clearTable = function(cb) {
    var query = squel.delete()
                .from("phones")
                .toParam();

    dbClient.query({text: query.text, values: query.values}, function(err, result) {
        if(err) {
            console.log("DB ERROR: deleting phones ", err.message);
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
    getPhones: getPhones,
    getPhone: getPhone,
    updatePhonePosition: updatePhonePosition,
    updatePhoneSocketId: updatePhoneSocketId,
    deletePhone: deletePhone,
    createFile: createFile,
    getFiles: getFiles,
    deleteFile: deleteFile,
    clearTable: clearTable,
    disconnect: disconnect
}

