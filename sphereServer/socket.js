var db = require('./db');

db.useTestDatabase();

var startListeners = function(io) {
    io.on('connection', function(socket) {
        let ipAddress = socket.request.connection.remoteAddress;
        db.getPhone(ipAddress, function(err, result) {
            if(result.rows.length === 0) {
                db.createPhone(ipAddress, socket.id, function(err, result) {
                    io.emit("pos", result.rows[0].position);
                });
            } else {
                io.emit('pos', result.rows[0].position);
            }
        });

        socket.on('register position', function(msg) {
            let pos = msg;
            db.updatePhonePosition(ipAddress, pos, function(err, result) {
                io.emit('newpos', result.rows[0].position);
            });
        });
    });
}

module.exports = {
    startListeners: startListeners
}
