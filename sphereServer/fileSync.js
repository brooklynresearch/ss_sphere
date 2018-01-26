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
        db.useTestDatabase();
        this.fileTable = [];
        this.remoteFiles = [];
        //this.setUpdateHour('9');
    }

    setUpdateHour(updateHour) {
        console.log("Setting File Sync Update Hour: ", updateHour);
        var job = schedule.scheduleJob('0 ' + updateHour + ' * * *', () => {
            this.checkForUpdates();
        });
    }

    checkForUpdates() {
        this.getSavedFiles(() => {
            this.getRemoteFileList(() => {
                this.saveNewFiles();
            });
        });
    }

    saveLocalFiles() {
        console.log("Checking local files");
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

                        db.createFile(file, size, false, (err, result) => {
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
        console.log("getting db files");
        db.getFiles((err, result) => {
            var i = 0;
            if (!err && result.rows.length != 0) {
                result.rows.forEach((row) => {
                    this.fileTable.push(row.name);
                    i++;
                    if ( i >= result.rows.length ) {
                        done();
                    }
                });
            }
            else {
                done();
            }
        });
    }

    getRemoteFileList(done) {
        let url = "http://ec2-52-44-183-233.compute-1.amazonaws.com/show_videos.json";
        request({
            url: url,
            json: true,
        }, (err, response, body) => {
            if (err) {
                console.log("Error getting CMS file list: ", err);
            } else {
                console.log("Got CMS file list:");
                this.remoteFiles = body;
                console.log(this.remoteFiles);
                done();
            }
        });
    }

    sendFileList() {
        db.getFiles((err, result) => {
            if (err) {
                console.log("Error reading file table: ", err.message);
            } else {
                let jsonData = result.rows.map(function(r) {
                    return {id: r.id, name: r.name, active: r.active, selected: r.selected, size: r.size}
                });
                console.log("Sending File List", jsonData);
                socket.sendSocketBroadcast('filelist', jsonData);
            }
        });
    }

    saveNewFiles() {
        let numDls = 0;
        this.remoteFiles.forEach((rfile) => {
            if ( this.fileTable.indexOf(rfile.file_name) === -1 ) { // New file in CMS
                let fileUrls = [rfile.file_path, rfile.thumbnail];
                fileUrls.forEach((fileUrl) => { // Get moviefile and thumbnail
                    numDls++;
                    console.log("Downloading File from CMS: ", fileUrl);
                    let end = fileUrl.split('/').pop();
                    let fname = end.split('?')[0];
                    let isActive = rfile.visible;
                    if (fname.includes("tmp")) {
                        fname = rfile.file_name + ".jpg";
                    }
                    this.downloadFromCMS(fileUrl, fname, () => {
                        //console.log("Downloaded file from CMS: ", rfile.file_name);
                        let stats = fs.statSync('./public/moviefiles/' + fname);
                        let size = stats.size;
                        db.createFile(fname, size, isActive, (err, result) => {
                            if (err) {
                                console.log("ERROR saving file: ", err.message);
                            } else {
                                console.log("New File Saved in DB: " , result.rows[0].name);
                                console.log("Size in bytes: " , result.rows[0].size);
                                numDls--;
                                if (numDls === 0) {
                                    this.sendFileList();
                                }
                            }
                        });
                    });
                });
            }
            // Update all 'active' fields
            db.setActive(rfile.file_name, rfile.visible, (err, result) => {
                if (err) {
                    console.log("ERROR setting file active: ", err.message);
                } else {
                    console.log("File set active: ", result.rows);
                    this.sendFileList();
                }
            })
        });
    }

    downloadFromCMS(file_url, filename, done) {
        let downloadDir = './public/moviefiles/';
        // create an instance of writable stream
        var file = fs.createWriteStream(downloadDir + filename);
        // execute curl using child_process' spawn function
        var curl = spawn('curl', [file_url]);
        // add a 'data' event listener for the spawn instance
        curl.stdout.on('data', function(data) { file.write(data); });
        // add an 'end' event listener to close the writeable stream
        curl.stdout.on('end', function(data) {
            file.end();
            console.log(filename + ' downloaded to ' + downloadDir);
            done();
        });
        // when the spawn child process exits, check if there were any errors and close the writeable stream
        curl.on('exit', function(code) {
            file.end();
            if (code != 0) {
                console.log('Failed: ' + code);
            }
        });
    }

    sendDownloadLink(url) {
        console.log("Broadcasting url: ", url);
        socket.sendSocketBroadcast("file", url);
    }
}

module.exports.FileSync = new FileSync;

