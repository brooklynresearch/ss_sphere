exports.up = function(pgm,run) {

    pgm.addColumns("files",
        {'dir': {type: 'string'}}
    );
    run();

};

exports.down = function(pgm,run) {

    pgm.dropColumns("files", ['dir']);
    run();

};

