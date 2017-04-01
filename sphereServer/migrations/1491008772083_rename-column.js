exports.up = function(pgm, run) {
    pgm.renameColumn('phones', 'ip-address', 'ipaddress');
    run();
};

exports.down = function(pgm, run) {
    pgm.renameColumn('phones', 'ipaddress', 'ip-address');
    run();
};
