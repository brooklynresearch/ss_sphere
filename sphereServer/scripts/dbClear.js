require('dotenv').config();
var db = require('../db');

var table = process.env.TABLE;

function connect() {
    return new Promise((accept, reject) => {
        if(db.connect())
            accept();
        else
            reject("Could not connect");
    });
}

function clearFiles() {
    console.log("Deleting all file entries.");
    return new Promise((accept, reject) => {
        db.clearFiles((err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log("Deleted file entries. ", result);
                accept();
            }
        });
    })
}

function clearPhones() {
    console.log("Deleting all phone entries.");
    return new Promise((accept, reject) => {
        db.clearPhones((err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log("Deleted phone entries. ", result);
                accept();
            }
        });
    });
}

function disconnect() {
    console.log("Done.");
    db.disconnect();
}

connect()
    .then(table === "files" ? clearFiles : clearPhones)
    .then(disconnect)
    .catch(console.error);

