const { Pool } = require('pg');//Подгружаю модуль бд
const { db } = require('../config');//Конфиг для подключения к бд

const pool = new Pool(db);//Подключение

//Проверка подключения
pool.query('SELECT NOW()', (err) => {
    if(err) console.log('Cant`t connect to db', err);//Лог об ошибке
    else console.log('Connected to database: ' + db.database);//Лог о успешном подключении
});

//Экспорт функции для получения заказов для роли менеджера
module.exports.getOrders= (from = 0, to = 0)=>{//Функция имеет необязательные параметры для получения заказов в промежутках между датам
    //Все функции организованы на основе промиса только с ресолв параметром и от каждой функции одидается
    //возвращение масива с полем для обраной связи(alert) и в случае ошибки поля(err), в случае успешного запроса - поля с ожидаемым названием
    return new Promise(resolve => {
        //Функция делется на 4 случая с разными входными параметрами
        //Содержит 4 похожих SQL запроса
        if(!from && !to) pool.query(`SELECT orders.id, orders.code, orders.state, orders.created, orders.invoice, orders.customer, products.name AS product, products.price AS full_price, products.date AS product_creation_date, discounts.coefficients FROM public.orders JOIN public.products ON products.code = orders.code LEFT JOIN public.discounts ON discounts.code = orders.code ORDER BY orders.created ASC`, (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});//Ресолвим ошибку
            else resolve({rows:res.rows, alert:'All orders of all time'});//Ресолвим ответ
        });
        //В осальных случаях все работает так же
        if(from && to) pool.query(`SELECT orders.id, orders.code, orders.state, orders.created, orders.invoice, orders.customer, products.name AS product, products.price AS full_price, products.date AS product_creation_date, discounts.coefficients FROM public.orders JOIN public.products ON products.code = orders.code LEFT JOIN public.discounts ON discounts.code = orders.code WHERE orders.created BETWEEN $1 AND $2 ORDER BY orders.created ASC`, [from, to], (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            else resolve({rows:res.rows, alert:'Orders from ' + from + ' to ' + to});
        });
        if(from && !to) pool.query(`SELECT orders.id, orders.code, orders.state, orders.created, orders.invoice, orders.customer, products.name AS product, products.price AS full_price, products.date AS product_creation_date, discounts.coefficients FROM public.orders JOIN public.products ON products.code = orders.code LEFT JOIN public.discounts ON discounts.code = orders.code WHERE orders.created > $1 ORDER BY orders.created ASC`, [from], (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            else resolve({rows:res.rows, alert:'All orders from ' + from});
        });
        if(!from && to) pool.query(`SELECT orders.id, orders.code, orders.state, orders.created, orders.invoice, orders.customer, products.name AS product, products.price AS full_price, products.date AS product_creation_date, discounts.coefficients FROM public.orders JOIN public.products ON products.code = orders.code LEFT JOIN public.discounts ON discounts.code = orders.code WHERE orders.created < $1 ORDER BY orders.created ASC`, [to], (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            else resolve({rows:res.rows, alert:'All orders to ' + to});
        });
    });
};

//Функция для подтверждения оплаты клиентом счета
module.exports.confirmPayment = (id)=>{
    return new Promise(resolve => {
        pool.query(`UPDATE public.orders SET state = 'paid' WHERE id = ${id} AND state = 'confirmed' AND invoice IS NOT NULL RETURNING state`, (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            //Исключение на случай, если будут пытаться оплатить уже оплаченый заказ или только созданный
            else if(!res.rows[0]) resolve({alert:'Bad status of order to confirm payment',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "To confirm payment order need to be confirmed and invoice be generated"
                }});
            else resolve({alert:'Order successfully paid'});
        });
    });
};

//Функция для генерации счета за товар
module.exports.invoice = (id)=>{
    return new Promise(resolve => {
        //Запрос на установку даты генерации счера, если дата уже существует то будет сгенерирован счет с старой датой
        pool.query(`UPDATE public.orders SET invoice = COALESCE(invoice, now()) WHERE id = ${id} AND state = 'confirmed' RETURNING state`, (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            //Исключение на случай не подходящего статуса товара
            else if(!res.rows[0]) resolve({alert:'Bad status of order to generate invoice',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "To generate invoice state need to be confirmed"
                }});
            //Запрос на получение необходимых данных по счету
            else pool.query(`SELECT orders.id, orders.code, products.name AS product, products.price, orders.created, orders.invoice, orders.customer, products.date AS product_created_date, discounts.coefficients FROM public.orders JOIN public.products ON products.code = orders.code LEFT JOIN public.discounts ON discounts.code = orders.code WHERE id = ${id};`,(err, res)=>{
                if(err) resolve({err:err, alert:'Orders database error'});
                else resolve({rows:res.rows, alert:'Invoice successfully created'});
            });
        });
    });
};

//Запрос на создание заказа
module.exports.newOrder = (code, customer)=>{
    return new Promise(resolve => {
        //Проверка наличия товара с заданым кодом
        pool.query(`SELECT code FROM public.products WHERE code = ${code}`, (err, res)=>{
            if(err) resolve({err:err, alert:'Products database error'});
            //Исключение на случай указания не существующего товара
            else if(!res.rows[0]) resolve({alert:'There isn`t product with such code',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "Can`t find product with such code in products database"
                }});
            //Создание запроса на добавление заказа
            else pool.query(`INSERT INTO public.orders(code, state, created, customer) VALUES (${code}, 'created', now(), '${customer} ') RETURNING id;`, (err, res)=>{
                    if(err) resolve({err:err, alert:'Database insertion error'});
                    else resolve({rows:res.rows, alert:'Order successfully created with id: ' + res.rows[0].id});
                });
        });
    });
};

//Запрос на подтверждение заказа(подтверждение выдачи товара)
module.exports.confirmOrder = (id)=>{
    return new Promise(resolve => {
        //Запрос на проверку состояния заказа и его наличия
        pool.query(`SELECT state FROM public.orders WHERE id = ${id}`, (err, res)=>{
            if(err) resolve({err:err, alert:'Orders database error'});
            //Исключение на случай отсутствия заказа
            else if(!res.rows[0]) resolve({alert:'There isn`t order with such id',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "422",
                    "text": "Can`t find order with such id in orders database"
                }});
            //Исключения на случай неправильного состояния заказа
            else if(res.rows[0].state != 'created') resolve({alert:'Order already was recipted',err:{
                    "name": "error",
                    "severity": "ERROR",
                    "code": "403",
                    "text": "No permissions to change this order"
                }});
            //Обновления статуса заказа
            else pool.query(`UPDATE public.orders SET state = 'confirmed' WHERE id = ${id}`, (err)=>{
                    if(err) resolve({err:err, alert:'Database updating error'});
                    else resolve({rows:id, alert:'Order successfully updated, invoice ready to generate'});
                });
        });
    });
};

//Запрос на получение всех заказов с статусом(created) для удобства консультантам в магазине
module.exports.forRecipt = ()=>{
    return new Promise(resolve => {
        //Запрос на получение
        pool.query(`SELECT * FROM public.orders WHERE state = 'created' ORDER BY created`, (err, res)=>{
            if(err) resolve({err:err, alert:'Can`t select. Database error'});
            else resolve({rows:res.rows, alert:'All orders to recipt are selected'});
        });
    });
};