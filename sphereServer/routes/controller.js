var express = require('express');
var router = express.Router();
var fs = require('fs');
var db = require('../db');
// liberty, times square, blossoms
//var timeFrames = [ 7, 7, 7, 7 ];
//var names = ['Liberty', 'Times Square', 'Central Park', 'Logo'];
/* GET home page. */
router.get('/', function(req, res, next) {
  var names = process.env.POSITION_NAMES.split()
  var posStrings = process.env.VIDEO_POSITIONS.split()
  res.render('controller', { title: 'Express', 
  		vid1: posStrings[0], 
  		vid2: posStrings[1], 
  		vid3: posStrings[2],
  		vid4: posStrings[3],
  		name1: names[0],
  		name2: names[1],
  		name3: names[2],
  		name4: names[3]
  	});
});

router.get('/newconfig', function(req, res, next) {

    saveLocalFiles() {
        fs.readdir('../public/moviefiles/', (err, files) => {
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
    res.end();
});

module.exports = router;
