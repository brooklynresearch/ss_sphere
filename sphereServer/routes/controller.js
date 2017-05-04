var express = require('express');
var router = express.Router();
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

module.exports = router;
