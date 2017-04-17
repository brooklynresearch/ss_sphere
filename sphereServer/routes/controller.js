var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('controller', { title: 'Express', vid1: '20160803_451_Samsung837_IH-C_Final-422HQ-3840x2160-h265-gearvr_1.mp4', vid2: 'DYNE_FinalOutput_Gear360_H264_3840x1920.mp4', vid3: '360Still_Stringout_FullRes_injected.mp4' });
});

module.exports = router;
