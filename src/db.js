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

module.exports.confirmOrder = (id)=>{
    return new Promise(resolve => {
        pool.query(`SELECT state FROM public.orders WHERE id = ${id}`, (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            else if(!res.rows[0]) resolve({alert:'There isn`t order with such id',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "Can`t find order with such id in orders database"
                }});
            else if(res.rows[0].state != 'created') resolve({alert:'Order already was recipted',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "403",
                    "text": "No permissions to change this order"
                }});
            else pool.query(`UPDATE public.orders SET state = 'confirmed' WHERE id = ${id}`, (err)=>{
                    if(err) resolve({err:err, alert:'Database updating error'});
                    else resolve({rows:id, alert:'Order successfully updated, invoice ready to generate'});
                });
        });
    });
};

module.exports.forRecipt = ()=>{
    return new Promise(resolve => {
        pool.query(`SELECT * FROM public.orders WHERE state = 'created' ORDER BY created`, (err, res)=>{
            if(err) resolve({err:err, alert:'Can`t select. Database error'});
            else resolve({rows:res.rows, alert:'All orders to recipt are selected'});
        });
    });
};