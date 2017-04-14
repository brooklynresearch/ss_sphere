var db = require('./db');
var events = require('events');
var socket = require('./socket');

class FileSync extends events.EventEmitter {
    constructor() {
        super();
        this.updateHour;
        this.localFiles;
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

    getLocalFiles(done) {
        db.getFiles((err, result) => {
            if (!err) {
                this.localFiles = result.rows;
                done();
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

