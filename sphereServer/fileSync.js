var fs = require('fs');
var db = require('./db');
var events = require('events');
var socket = require('./socket');
var request = require('request');
var url = require('url');
var spawn = require('child_process').spawn;
var schedule = require('node-schedule');

class FileSync extends events.EventEmitter {
    constructor() {
        super();
        db.connect();
        this.fileTable = [];
        this.foundFiles = [];
    }

    getFileTable() {
        return this.fileTable;
    }

    /* get list of files saved in database */
    getSavedFiles() {
        return new Promise((accept, reject) => {
            console.log("getting db files");
            db.getFiles((err, result) => {
                if (err)
                    reject(err);
                else {
                    result.rows.map(row => {
                        this.fileTable.push({id: row.id, dir: row.dir, name: row.name});
                    });
                    accept();
                }
            });
        });
    }

    scanFolders() {
        console.log("scan");
        let p1 = this.scanDirectory("imagefiles");
        let p2 = this.scanDirectory("moviefiles");
        return Promise.all([p1,p2])
    }

    makeFileList(dirs) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < dirs.length; i++) {
                dirs[i].files.map(f => {
                    this.foundFiles.push({dir: dirs[i].dir, name: f});
                });
            }
            resolve();
        });
    }

    /* get list of files in dirName */
    scanDirectory(dirName) {
        return new Promise((accept, reject) => {
            fs.readdir("./public/" + dirName + "/", (err, files) => {
                if (err)
                    reject(err);
                else
                    accept({dir: dirName, files: files});
            });
        });
    }

    /* Delete file entries in database that have since been removed from dirName */
    deleteOldFiles() {
        console.log(this.foundFiles);
        let files = this.foundFiles;
        let fileTable = this.getFileTable();
        return new Promise((resolve, reject) => {
            fileTable.map(fileEntry => {
                let match = files.filter(f => f.name === fileEntry.name && f.dir === fileEntry.dir);
                if (match.length < 1) {
                    db.deleteFile(fileEntry.id, (err, result) => {
                        if (err)
                            reject(err);
                        else 
                            console.log("Deleted file");
                    });
                }
            });
            resolve();
        });
    }

    saveNewFiles() {
        let files = this.foundFiles;
        let fileTable = this.getFileTable();
        console.log("FILES: ", files);
        let nameList = fileTable.map(f => f.name);
        return new Promise((resolve, reject) => {
            let fileList = files;
            Promise.all(fileList.map(file => {
                if (file.name[0] !== '.' && nameList.indexOf(file.name) === -1) {
                    console.log("Found new file: ", file);
                    let stats = fs.statSync('./public/' + file.dir + "/" + file.name);
                    let size = stats.size;
                    console.log("size", size);
                    db.createFile(file.name, file.dir, size, false, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log("New file in "+ result.rows[0].dir +": " , result.rows[0].name);
                            console.log("Size in bytes: " , result.rows[0].size);
                        }
                    });
                } else {
                    resolve();
                }
            })).then(resolve());
        });
    }

    updateDatabase(cb) {
        this.getSavedFiles()
            .then(this.scanFolders.bind(this))
            .then(this.makeFileList.bind(this))
            .then(this.deleteOldFiles.bind(this))
            .then(this.saveNewFiles.bind(this))
            .then(cb)
            .catch(console.error);
    }

    sendFileList() {
        db.getFiles((err, result) => {
            if (err) {
                console.log("Error reading file table: ", err.message);
            } else {
                let jsonData = result.rows.map(function(r) {
                    return {id: r.id, dir: r.dir, name: r.name, active: r.active, selected: r.selected, size: r.size}
                });
                console.log("Sending File List", jsonData);
                socket.sendSocketBroadcast('filelist', jsonData);
            }
        });
    }

}

module.exports.FileSync = new FileSync;

