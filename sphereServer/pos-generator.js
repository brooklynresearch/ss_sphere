/*
	Generator for creating a JSON position parameters file
*/

// [, , , , , , , , , , , ]

var fs = require('fs');

// number of phones per row; the length of this is the number of rows total
var rowPhones = [6, 9, 10, 11, 12, 13, 13, 12, 11, 10, 9, 6];

// the starting Longitude of each "leftmost" phone in the row
// the first half and second half should be symmetrical
var rowLongOrigin = [30.0, 24.0, 18.0, 12.0, 6.0, 0.0, 0.0, 6.0, 12.0, 18.0, 24.0, 30.0];
var longOrigin = 6.0;
var longOriginCalc = true;

// the difference in longitude between each phone for each row
// these should probably be the exact same for all, so we may actually generate this

var rowLongOffset = [8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0, 8.0];
var longOffset = 11.1;
var longCalc = true;

// These are the latitude settings for all phones of each row
// it may make sense to make it generative
var rowLat = [44.0, 36.0, 28.0, 20.0, 12.0, 4.0, -4.0, -12.0, -20.0, -28.0, -36.0, -44.0]; 
var latOffset = 15.1;
var latOrigin = 0.0;
var latCalc = true;

// assuming this should be the same for all
var fov = 15.0;


var generatedJSON = positionGenerator();

function positionGenerator() {

	var jsonData = {};
	
	for(var row = 0; row < rowPhones.length; row++){

		// calculate latitude
		var latitude;

		if(latCalc){
			latitude = latOrigin - latOffset/2 + latOffset * (rowLat.length/2 - row);
			// latitude = latitude.toFixed(5);
		}
		else{
			latitude = rowLat[row];
		}

		if(longOriginCalc){
			if(row < rowLongOrigin.length / 2){
				rowLongOrigin[row] = longOrigin * ((rowLongOrigin.length / 2) - row - 1);
				rowLongOrigin[rowLongOrigin.length - row - 1] = rowLongOrigin[row];
			}
		}

		for(var col = 0; col < rowPhones[row]; col++){
			var eachData = {};

			// calculate longitude
			var longitude;


			if(longCalc){
				longitude = rowLongOrigin[row] + longOffset * col;
				// longitude = longitude.toFixed(5);
			}
			else{
				longitude = rowLongOrigin[row] + rowLongOffset[row] * col;
			}

			eachData['long'] = longitude;

			eachData['lat'] = latitude;

			// calculate fov
			eachData['fov'] = fov;

			var row_col_string = rowColGenerator(row, col);
			jsonData[row_col_string] = eachData;
			console.log(eachData);
		}	
	}

	return jsonData;
}

function rowColGenerator(row, col) {

	var rowString = (row+1).toString();
	var colString = (col+1).toString();

	if(row < 9){
		rowString = "0" + rowString;
	}

	if(col < 9){
		colString = "0" + colString;
	}

	return rowString+colString;
}

console.log("Here is your JSON");
//console.log(generatedJSON);

var fileDirectory = "public/"

fs.writeFile(fileDirectory + "positions.json", JSON.stringify(generatedJSON), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

module.exports = {
   generateParams: positionGenerator
}

