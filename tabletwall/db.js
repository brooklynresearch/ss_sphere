var db = require('pg-query');
var squel = require('squel').useFlavour('postgres');
var _ = require('lodash');

db.connectionParameters = process.env.DATABASE_URL;

var toggleActivated = function(pos, cb) {
  
  var toggled = squel.select().field('NOT(activated)')
    .from('positions').where('wallnumber = ?', pos);
  var query = squel.update()
    .table('positions')
    .set('activated', toggled)
    .where('wallnumber = ?', pos)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      console.log("ERROR toggling position: " + err);
      return;
    } else {
      console.log("TOGGLED position " + pos);
      console.log(results[0]);

      // Grab the socket ids for tablets that registered this position
      // and pass them back to the socket listener to update them
      getSocketsByPosition(results[0].wallnumber, function(sockets) {
        cb(sockets);
      });
    }
  });
}

var getSocketsByPosition = function(wallNumber, cb){

  var query = squel.select()
    .from('tablets')
    .where('tabletwallnumber = ?', wallNumber)
    .toParam();

  db(query.text, query.values, function(err, tablets) {
    if (err) {
      console.log("ERROR getting socket id: " + err);
    }
    else {

    // if (tablets.length != 0) {
      var sockets = _.castArray(_.map(tablets, 'socketid'));
      cb(sockets);
    // }
    }
  });
}

var createTablet = function(ipAddr, socketId, cb) {

  var query = squel.insert().into('tablets')
    .set('ipaddress', ipAddr)
    .set('socketid', socketId)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      console.log("ERROR adding tablet to db: " + err);
      return;
    } else {
      console.log("ADDED tablet to db");
      console.log(results[0]);
      cb();
    }
  });
}

var updateTabletPosition = function(ipAddr, pos, cb) {

  var posQuery = squel.select().field('wallNumber')
    .from('positions').where('wallNumber = ?', pos);
  var query = squel.update()
    .table('tablets')
    .set('tabletwallnumber', posQuery)
    .where('ipAddress = ?', ipAddr)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      console.log("ERROR updating tablet position: " + err);
      return;
    } else {
      console.log("UPDATED tablet position");
      var tablet = results[0];
      console.log(tablet);
      isPositionActivated(pos, function(isActivated) {
        cb(tablet.tabletwallnumber, isActivated);
      });
    }
  });
}

var isPositionActivated = function(position, cb) {

  var query = squel.select()
    .field('activated')
    .from('positions')
    .where('wallnumber = ?', position)
    .toParam();

  db(query.text, query.values, function(err, rows, result) {
    if(err) {
      console.log("ERROR getting position state: " + err);
    } else {
      console.log("isActivated: " + rows[0].activated);
      cb(rows[0].activated == true);
    }
  });
}

var updateTabletSocket = function(ipAddr, socketId, cb) {

  var query = squel.update()
    .table('tablets')
    .set('socketid', socketId)
    .where('ipaddress = ?', ipAddr)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results){
    if (err) {
      console.log ("ERROR updating socket id " + err);
      return;
    } else {
      var tablet = results[0];
      console.log("UPDATED socket id for " + tablet.ipaddress + ": " + tablet.socketid);
      if (tablet.tabletwallnumber) {
        isPositionActivated(tablet.tabletwallnumber, function(isActivated) {
          cb(tablet.tabletwallnumber, isActivated);
        });
      }
    }
  });
}

var getKnownTablets = function(cb) {

  var query = squel.select()
    .from('tablets')
    .field('ipaddress')
    .toString();

  db(query, function(err, rows, result) {
    if (err) {
      console.log("ERROR retrieving stored IPs: " + err);
      return;
    } else {
      var ipAddrs = _.map(rows, 'ipaddress');
      cb(ipAddrs);
    }
  });
}

var resetPositions = function(cb) {

  var query = squel.update()
    .table('positions')
    .set('activated', false)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      console.log("ERROR resetting positions");
      return;
    } else {
      cb();
    }
  });
}

var dump = function(time, cb) {

  console.log("Trying to dump...");

  var path = process.env.DUMP_PATH;
  var filepath = path + time + '.csv';

  var query = "COPY (SELECT name, position, wave, "+
    "won_at FROM prizes) "+
    "TO '" + filepath + "' WITH CSV HEADER";

  db(query, [], function(err) {
    if (err) { 
      console.log("ERROR creating csv dump: " + err);
      cb(err, null);
    } else {
      cb(null, filepath);
    }
  });
}

var allActivated = function(cb) {

  var query = squel.select()
    .from('positions')
    .where('activated = ?', false)
    .toParam();

  db(query.text, query.values, function(err, results){
    //console.log("some text in there: " + results);
    if (results.length > 0){
      cb(false);
    }
    else{
      cb(true);
    }
  });
}

var updatePrize = function(wave, position, name, cb) {

  var query = squel.update()
    .table('prizes')
    .set('name', name)
    .where('wave = ?', wave)
    .where('position = ?', position)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, results[0]);
    }
  });
}

var setPrizeTime = function(wave, position, cb) {

  var query = squel.update()
    .table('prizes')
    .set('won_at', squel.str('NOW()'))
    .where('wave = ?', wave)
    .where('position = ?', position)
    .returning('*')
    .toParam();

    db(query.text, query.values, function(err, results) {
      if (err) {
        cb(err);
      } else {
        console.log("Wave " + wave + " Prize " + position + " won at " + results[0].won_at);
        cb(null);
      }
    });
}

var resetPrizeTimes = function(cb) {

  var query = squel.update()
    .table('prizes')
    .set('won_at', null)
    .returning('*')
    .toParam();

  db(query.text, query.values, function(err, results) {
    if (err) {
      cb(err);
    } else {
      console.log("[*] Reset win times for " + results.length + " prizes");
      cb(null);
    }
  });
}

var getPositionStates = function(cb) {

  var query = squel.select()
    .field('activated')
    .field('wallnumber')
    .from('positions')
    .order('wallnumber', true)
    .toParam();

  db(query.text, query.values, function(err, rows, result) {
    if (err) {
      cb(err, null);
    } else {
      cb(null, rows);
    }
  });
}

module.exports = {
  updateTabletSocket: updateTabletSocket,
  toggleActivated: toggleActivated,
  createTablet: createTablet,
  updateTabletPosition: updateTabletPosition,
  getKnownTablets: getKnownTablets,
  resetPositions: resetPositions,
  dump: dump,
  allActivated: allActivated,
  updatePrize: updatePrize,
  setPrizeTime: setPrizeTime,
  resetPrizeTimes: resetPrizeTimes,
  getPositionStates: getPositionStates
}
