var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Tablet Wall' });
});

router.get('/dumper', function(req, res) {
  var time = Date.now();

  db.dump(time, function(err, filepath) {
    if (err) {
      res.status(500).end();
    } else {
      res.send(filepath).end();
    }
  });
});

module.exports = router;