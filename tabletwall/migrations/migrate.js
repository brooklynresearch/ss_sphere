var postgrator = require('postgrator');
require('dotenv').config({path: process.argv[2]});

postgrator.setConfig({
  migrationDirectory: __dirname,
  driver: 'pg',
  connectionString: process.env.DATABASE_URL
});

postgrator.migrate('max', function(err, migrations) {
  if(err)   console.log(err);
  postgrator.endConnection(function () {
    console.log('Done')
  });
});
