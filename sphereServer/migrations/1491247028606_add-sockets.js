exports.up = function(pgm, run) {
    pgm.dropColumns("phones", ['position']);
    pgm.addColumns("phones",
        {'socketid': {type: 'string'},
        'position': {type: 'integer'}}
    );
    run();
};

exports.down = function(pgm, run) {
    pgm.dropColumns("phones", ['position']);
    pgm.dropColumns("phones", ['socketid']);
    pgm.addColumns("phones",
        {'position': {type: 'integer', unique: true}}
    );
    run();
};
