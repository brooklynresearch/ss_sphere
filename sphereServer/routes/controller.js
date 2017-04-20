var express = require('express');
var router = express.Router();
// liberty, times square, blossoms
var timeFrames = [2, 8, 32, 0];
var names = ['Liberty', 'Times Square', 'Central Park', 'Logo'];
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('controller', { title: 'Express', 
  		vid1: timeFrames[0], 
  		vid2: timeFrames[1], 
  		vid3: timeFrames[2],
  		vid4: timeFrames[3],
  		name1: names[0],
  		name2: names[1],
  		name3: names[2],
  		name4: names[3]
  	});
});

module.exports = router;
