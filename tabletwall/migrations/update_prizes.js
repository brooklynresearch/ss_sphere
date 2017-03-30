require('dotenv').config({path: process.argv[2]});
var db = require('../db');
var reader = require('readline');

var lineReader1 = reader.createInterface({
  input: require('fs').createReadStream('prizes-wave1.txt')
});

lineReader1.on('line', function (line) {
  //console.log('Line from file:', line);
  var pos = parseInt(line.slice(0,2));
  if (pos) { // Only care about lines starting with a position number
  	var name = line.slice(3); // Everything after the number

  	db.updatePrize(1, pos, name, function(err, row) {
  		if (err) {
  			console.log("ERROR UPDATING PRIZES: " + err);
  		} else {
  			console.log("Updated WAVE 1 Position " + row.position + ": " + row.name);
  		}
  	});	
  }
});

var lineReader2 = reader.createInterface({
  input: require('fs').createReadStream('prizes-wave2.txt')
});

lineReader2.on('line', function(line){
  //console.log('Line from file:', line);
  var pos = parseInt(line.slice(0,2));
  if (pos) { // Only care about lines starting with a position number
  	var name = line.slice(3); // Everything after the number

  	db.updatePrize(2, pos, name, function(err, row) {
  		if (err) {
  			console.log("ERROR UPDATING PRIZES: " + err);
  		} else {
  			console.log("Updated WAVE 2 Position " + row.position + ": " + row.name);
  		}
  	});	
  }
});