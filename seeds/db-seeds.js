const { Pool } = require('pg');
const { db } = require('../config');

const pool = new Pool(db);

pool.on('error', (err, client) => {
    console.log('Can`t connect to DB');
    pool.end();
})

pool.query(`CREATE TABLE IF NOT EXISTS public.products
(code integer,name character varying COLLATE pg_catalog."default",price double precision,date date,PRIMARY KEY (code))
WITH (OIDS = FALSE)
TABLESPACE pg_default;
ALTER TABLE public.products
OWNER to ${db.user};`, (err) => {
    if(err) console.log('Products DB creation error');
    else {
        pool.query(`INSERT INTO public.products (code, name, price, date) VALUES 
        ('234234', 'Stove', '1805.5', '11.2.2019'),
        ('234141', 'Oven', '980', '12.9.2019'),
        ('214414', 'Sink', '2100', '10.9.2019'),
        ('144123', 'Fridge', '3280.2', '10.18.2019'),
        ('234532', 'Cabinet', '260', '11.20.2019'),
        ('239615', 'Dishwasher', '1365.8', '11.21.2019'),
        ('983265', 'Washing machine', '2365.8', '11.18.2019'),
        ('329572', 'Toaster', '329', '12.8.2019'),
        ('346366', 'Table', '1000', '12.1.2019'),
        ('823755', 'Chairs', '220', '9.29.2019'),
        ('346566', 'TV set', '3800', '10.28.2019'),
        ('835433', 'Plate', '20', '10.11.2019'),
        ('437471', 'Cup', '15', '11.23.2019');`, (err)=>{
            if(err) console.log('Error in creation fake products');
            else {
                pool.query(`CREATE TABLE IF NOT EXISTS public.orders
                (id serial NOT NULL,code integer REFERENCES public.products (code),state character varying,created date,invoice date,customer character varying,PRIMARY KEY (id))
                WITH (OIDS = FALSE)
                TABLESPACE pg_default;
                ALTER TABLE public.orders
                OWNER to ${db.user};`,(err)=>{
                    if(err) console.log('Orders DB creation error');
                    pool.query(`INSERT INTO public.orders(code, state, created, customer)VALUES 
                                ('234234', 'created', '11.20.2019', 'Denis Kuznetsov'),
                                ('234141', 'created', '11.15.2019', 'Valentin Petrov'),
                                ('214414', 'created', '11.18.2019', 'Maksim Popov'),
                                ('234234', 'created', '11.15.2019', 'Valeriy Krijin'),
                                ('983265', 'created', '11.18.2019', 'Bogdan Polyakov'),
                                ('346566', 'created', '11.22.2019', 'Radion Babakov'),
                                ('983265', 'created', '12.1.2019', 'Vadim Motkov');`, (err)=>{
                        if(err) console.log('Error in creation fake orders');
                        else{
                            pool.query(`INSERT INTO public.orders(code, state, created, invoice, customer)VALUES 
                                ('144123', 'confirmed', '10.13.2019', NULL,'Grigoriy Denisenko'),
                                ('329572', 'confirmed', '11.16.2019', NULL,'Maksim Labudnoy'),
                                ('234234', 'confirmed', '10.20.2019',  '11.20.2019','Mihail Robahov'),
                                ('144123', 'confirmed', '10.15.2019', '11.20.2019','Vladimir Rutskin'),
                                ('329572', 'confirmed', '11.18.2019', '11.20.2019','Artem Safonov'),
                                ('234141', 'paid', '12.5.2019', '11.20.2019','Kiril Oleksandrov'),
                                ('239615', 'paid', '11.16.2019', '11.20.2019','Denis Nikolaev'),
                                ('144123', 'paid', '11.22.2019', '11.20.2019','Radion Babakov'),
                                ('823755', 'paid', '12.3.2019', '11.20.2019','Vadim Motkov');`, (err)=>{
                                if(err) console.log('Error in creation fake orders');
                                else{
                                    pool.query(`CREATE TABLE IF NOT EXISTS public.discounts (code integer, coefficients double precision)
                                        WITH (OIDS = FALSE) TABLESPACE pg_default;
                                        ALTER TABLE public.discounts OWNER to ${db.user};`, (err)=>{
                                        if(err) console.log('Discounts DB creation error');
                                        else {
                                            pool.query(`INSERT INTO public.discounts( code, coefficients ) VALUES 
                                                ('234234', '0.3'),
                                                ('239615', '0.1'),
                                                ('983265', '0.23'),
                                                ('835433', '0.11');`, (err)=>{
                                                if(err) console.log('Error in creation fake discounts');
                                                else {
                                                    console.log('Seeds successfully set!');
                                                    pool.end();
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    }
});