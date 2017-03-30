require('dotenv').config({path: process.argv[2]});
var db = require('../db');

db.resetPrizeTimes(function(err) {
	if (err) {
		console.log("[*] ERROR resetting prize win times: " + err);
		process.exit()
	} else {
		process.exit()
	}
})