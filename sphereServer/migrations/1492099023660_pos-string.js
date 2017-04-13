exports.up = function(pgm, run) {
    pgm.dropColumns("phones", ['position']);
    pgm.addColumns("phones",
        {'position': {type: 'string'}}
    );
    run();
};

exports.down = function(pgm, run) {
    pgm.dropColumns("phones", ['position']);
    pgm.addColumns("phones",
        {'position': {type: 'integer'}}
    );
    run();
};
