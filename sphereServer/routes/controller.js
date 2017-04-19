var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('controller', { title: 'Express', vid1: '1492567292838_injected.mp4', vid2: '1492618573031_o_ffmpeg.mp4', vid3: '1492620980033_sungLogo.mp4' });
});

module.exports = router;
