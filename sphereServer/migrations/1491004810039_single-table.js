exports.up = function(pgm, run) {
    pgm.addColumns("phones",
        {'ip-address': {type: 'string', unique: true}}
    );

    pgm.dropTable('ip-addresses');

    run();
};

exports.down = function(pgm, run) {
    pgm.dropColumns("phones", ['ip-address']);
    run();
};

