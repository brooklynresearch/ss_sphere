var express = require('express');
var router = express.Router();
var fs = require('fs');
const exec = require('child_process').exec;

/* GET home page. */
router.get('/', function(req, res, next) {

    exec("cat ./videofile.config | grep -e NAMES -e POSITIONS | sed -e 's/[=\"]/ /g' | awk '{print $2}'",
            (err, stdout, stderr) => {

            if (err) {
                console.log("ERROR: ", err);
            }
            var lines = stdout.split('\n');
            var posStrings = lines[0].split(',');
            var names = lines[1].split(',');

            res.render('controller', { title: 'Controller',
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
});

module.exports = router;
