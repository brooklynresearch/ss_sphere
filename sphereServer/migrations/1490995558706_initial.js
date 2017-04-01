exports.up = function(pgm, run) {
    pgm.createTable("phones",
        {'id': {type: 'serial', primaryKey: true},
        'position': {type: 'integer', unique: true}}
    );

    pgm.createTable("ip-addresses",
        {'address': {type: 'string', primaryKey: true, unique: true},
        'position': {type: 'integer', references: 'phones(position)'}}
    );
    run();
};

exports.down = function(pgm, run) {
    pgm.dropTable("ip-addresses");
    pgm.dropTable("phones");
    run();
};

