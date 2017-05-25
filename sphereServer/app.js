require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var routeController = require('./routes/controller');

var app = express();

// SOCKET IO
var server = require('http').Server(app);
var io = require('socket.io')(8080);

// OUR SOCKET MODULE
var socketModule;

var fileSync = require('./fileSync').FileSync;
//fileSync.setUpdateHour(process.env.UPDATE_HOUR);
fileSync.getSavedFiles(() => {
    fileSync.saveLocalFiles();
    socketModule = require('./socket');
    socketModule.startListeners(io);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/moviecontrol', index);
app.use('/play', index);
app.use('/pause', index);
app.use('/sendparams', index);
app.use('/hidedebug', index);
app.use('/dark', index);
app.use('/reload', index);
app.use('/frame', index);
app.use('/sleep', index);
app.use('/controller', routeController);
app.use('/newconfig', (req, res, next) => {
    console.log("Got /newconfig");
    fileSync.saveLocalFiles();
    res.end();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

