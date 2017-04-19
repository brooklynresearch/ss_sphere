exports.up = function(pgm, run) {

    pgm.addColumns("files",
        {'size': {type: 'integer'}}
    );
    run();

};

exports.down = function(pgm, run) {

    pgm.dropColumns("files", ['size']);
    run();
};
