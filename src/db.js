const { Pool } = require('pg');
const { db } = require('../config');

const pool = new Pool(db);

pool.query('SELECT NOW()', (err) => {
    if(err) console.log('Cant`t connect to db', err);
    else console.log('Connected to database: ' + db.database);
});