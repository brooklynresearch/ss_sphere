exports.up = function(pgm, run) {

    pgm.createTable('files',
        {'id': {type: 'serial', primaryKey: true},
        'name': {type: 'string'},
        'url': {type: 'string'},
        'runtime': {type:  'integer'},
        'active': {type: 'boolean'},
        'selected': {type: 'boolean'}}
    );
    run();
};

exports.down = function(pgm, run) {

    pgm.dropTable('files');
    run();
};

