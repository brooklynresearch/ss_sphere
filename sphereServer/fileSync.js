var fs = require('fs');
var db = require('./db');
var events = require('events');
var socket = require('./socket');

class FileSync extends events.EventEmitter {
    constructor() {
        super();
        db.useTestDatabase();
        this.updateHour;
        this.fileTable = [];
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
            // Delete old files from db
            this.fileTable.forEach((tfile) => {
                if (files.indexOf(tfile) === -1) {
                    db.deleteFile(tfile, (err, result) => {
                        if (err) {
                            console.log("ERROR deleting from db: ", tfile);
                        } else {
                            console.log("Deleted from db: ", tfile);
                        }
                    });
                }
            });
            // Save new files in db
            files.forEach((file) => {
                console.log("File: ", file);
                if (this.fileTable.indexOf(file) === -1) {
                    //let split = file.split('.');
                    //let filename = Date.now() + '_' + split[0].substr(split[0].length - 8) + '.' + split[split.length-1];
                    let stats = fs.statSync('./public/moviefiles/' + file);
                    let size = stats.size;
                    console.log("size", size);
                    console.log("ds check: ", file.includes(".DS_Store"));
                    if(!file.includes(".DS_Store")){

                        db.createFile(file, size, (err, result) => {
                            if (err) {
                                console.log("ERROR saving file: ", err.message);
                            } else {
                                console.log("New File: " , result.rows[0].name);
                                console.log("Size in bytes: " , result.rows[0].size);
                                //fs.renameSync('./public/moviefiles/'+file, './public/moviefiles/'+result.rows[0].name);
                            }
                        });
                    }
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
                        this.fileTable.push(row.name);
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

