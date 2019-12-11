const { Pool } = require('pg');
const { db } = require('../config');

const pool = new Pool(db);

pool.query('SELECT NOW()', (err) => {
    if(err) console.log('Cant`t connect to db', err);
    else console.log('Connected to database: ' + db.database);
});

module.exports.newOrder = (code, customer)=>{
    return new Promise(resolve => {
        pool.query(`SELECT code FROM public.products WHERE code = ${code}`, (err, res)=>{
            if(err) resolve({err:err, alert:'Products database error'});
            else if(!res.rows[0]) resolve({alert:'There isn`t product with such code',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "Can`t find product with such code in products database"
                }});
            else pool.query(`INSERT INTO public.orders(code, state, created, customer) VALUES (${code}, 'created', now(), '${customer} ') RETURNING id;`, (err, res)=>{
                    if(err) resolve({err:err, alert:'Database insertion error'});
                    else resolve({rows:res.rows, alert:'Order successfully created with id: ' + res.rows[0].id});
                });
        });
    });
};