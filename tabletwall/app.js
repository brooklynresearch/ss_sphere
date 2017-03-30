require('dotenv').config();

var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');

var routes = require('./routes/index');
var users = require('./routes/users');
var routeController = require('./routes/controller');
var db = require('./db');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Route setup
app.use('/', routes);
app.use('/dumper', routes);
app.use('/users', users);
app.use('/controller', routeController.show);
app.use('/static', express.static('public'));


var makePositionString = function(rows, cb) {

  var activated = "";
  var len = rows.length;
  var processed = 0;

  _.forEach(rows, function(row) {
    if (row.activated) {
      activated += row.wallnumber + " ";
    }
    if (++processed == len) {
      //console.log(activated);
      cb(activated);
    }
  });
}


// Fill array with IPs from database on startup
db.getKnownTablets(function(tablets) {

  var knownTablets = _.cloneDeep(tablets);
  var winDelay = 3000;
  var blacked = false;
  var wave = 1;

  // Websocket stuff
  io.on('connection', function(socket) {
    console.log('a user connected');
    var ipAddr = socket.request.connection.remoteAddress;
    if(knownTablets.indexOf(ipAddr) == -1) { // New IP Addr
      db.createTablet(ipAddr, socket.id, function() {
        knownTablets.push(ipAddr);
      });
    } else { // IP already in DB
      db.updateTabletSocket(ipAddr, socket.id, function(position, isActivated) {
        console.log("SAVED POSITION: " + position);
        socket.emit('pos', position);
        if(isActivated) {
          socket.emit('cmd', 'Activate!');
        }
      });
    }

    // Wall Tablet selecting position
    socket.on('register position', function(msg) {
      var ipAddr = socket.request.connection.remoteAddress;
      var pos = msg;
      db.updateTabletPosition(ipAddr, pos, function(newPos, isActivated) {
        socket.emit('pos', newPos);
        console.log("ACTIVATED: " + isActivated);
        if (isActivated) {
          socket.emit('cmd', 'Activate!');
        } else {
          socket.emit('cmd', 'Deactivate!');
        }
      });
    });

    // Controller Tablet activating position
    socket.on('activate position', function(msg) {
      console.log('Activate Position: ' + msg);
      db.toggleActivated(msg, function(socketIds) {
        
        console.log('check socketIds: ' + socketIds);

        var pos = parseInt(msg);
        db.setPrizeTime(wave, pos, function(err){
          if (err) {
            console.log("ERROR saving prize timestamp: " + err);
          }
        });

        db.allActivated(function(dieAntwoord) {
          if(dieAntwoord)
          {
            console.log("All activated");
            //setTimeout(function(){ 
              console.log("Sending win message");
              socket.emit('win', 'Win!'); 
            //}, winDelay);
          }
        });

        _.forEach(socketIds, function(id) {
          console.log("SENDING TOGGLE CMD TO: " + id);
          socket.broadcast.to(id).emit('cmd', 'Toggle!');
        });


      });
    });

    // Controller Tablet resetting all positions
    socket.on('ctrl', function(msg) {
      if (msg == 'reset positions') {
        db.resetPositions(function() {
          console.log("SETTING ALL positions inactive");
          socket.broadcast.emit('cmd', 'Deactivate!');
        });
      }
    });

    socket.on('gimme', function(msg) {
      if (msg == 'positions') {
        db.getPositionStates(function(err, rows) {
          if (err) {
            console.log("ERROR getting position states: " + err);
          } else {
            makePositionString(rows, function(positionString) {
              console.log("[*] UPDATING controller with positions: " + positionString);
              socket.emit('gimme', positionString);
            });          
          }
        });
      }
    });

    // Win condition
    socket.on('win', function(msg) {
      console.log("Controller sent Win!");
      socket.broadcast.emit('win', 'Win!');
    });

    socket.on('mode', function(msg) {
      console.log('Mode to: ' + msg);
      socket.broadcast.emit('mode', msg);
      wave = parseInt(msg);
    });

    // Dislay black
    socket.on('black', function(msg) {
      blacked = !blacked;
      var sendMsg;
      
      if(blacked){
        sendMsg = "off";
      }
      else{
        sendMsg = "on";
      }

      console.log("sending display: " + sendMsg);

      socket.broadcast.emit('black', sendMsg);
    });
    
  });
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(3000, function () {
        console.log('listening on port 3000!');
});

module.exports = app;
