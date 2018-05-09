require('dotenv').config();
var db = require('../db');

var table = process.env.TABLE;

function connect() {
    return new Promise((accept, reject) => {
        if(db.useTestDatabase())
            accept();
        else
            reject();
    });
}

function clearFiles() {
    console.log("Deleting all file entries.");
    return new Promise((accept, reject) => {
        db.clearFiles((err, result) => {
            if (err) {
                console.log("Error deleting file entries: ", err);
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
                console.log("Error deleting phone entries: ", err);
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
    .then(disconnect);
