var fs = require('fs');
var db = require('./db');
var events = require('events');
var socket = require('./socket');

class FileSync extends events.EventEmitter {
    constructor() {
        super();
        db.useTestDatabase();
        this.updateHour;
        this.localFiles = [];
        this.remoteFiles;
    }

    startClock(updateHour, cb) {

        this.updateHour = updateHour;
        var now = new Date();
        var milsUntilCheck = new Date(now.getFullYear(), now.getMonth(), now.getDate(), updateHour, 0, 0, 0) - now;

        setTimeout(() => {
            cb();
            startClock(this.updateHour, checkForUpdates);
        }, milsUntilCheck);
    }

    checkForUpdates() {
        getLocalFiles(() => {
            getRemoteFiles(() => {
                compareFiles();
            });
        });
    }

    saveLocalFiles() {
        fs.readdir('./public/moviefiles/', (err, files) => {
            var i = 0;
            files.forEach((file) => {
                console.log("File: ", file);
                if (this.localFiles.indexOf(file) === -1) {
                    let split = file.split('.');
                    let filename = Date.now() + '_' + split[0].substr(split[0].length - 8) + '.' + split[split.length-1];
                    db.createFile(filename, (err, result) => {
                        if (err) {
                            console.log("ERROR saving file: ", err.message);
                        } else {
                            console.log("New File: " , result.rows[0].name);
                            fs.renameSync('./public/moviefiles/'+file, './public/moviefiles/'+result.rows[0].name);
                        }
                    });
                }
            });
        });
    }

    getSavedFiles(done) {
        db.getFiles((err, result) => {
            var i = 0;
            if (!err) {
                if (result.rows.length === 0) {
                    done();
                } else {
                    result.rows.forEach((row) => {
                        this.localFiles.push(row.name);
                        i++;
                        if ( i >= result.rows.length ) {
                            done();
                        }
                    });
                }
            }
        });
    }

    getRemoteFiles(done) {
        //TODO Get file list from CMS
        this.remoteFiles = {};
        done();
    }

    compareFiles() {
        /* If local and remote do not match, download new file,
         * update database, and emit an event that includes local url
         * for phones to download from
         */
    }

    downloadFromCMS(url, done) {

    }

    sendDownloadLink(url) {
        console.log("Broadcasting url: ", url);
        socket.sendSocketBroadcast("file", url);
    }
}

module.exports.FileSync = new FileSync;

