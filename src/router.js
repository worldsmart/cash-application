const router = require('express').Router();
const db = require('./db');

router.post('/add_order', (req, res)=>{
    if(req.headers.authorization && req.body.product && req.body.customer && validation({role:req.headers.authorization, product:req.body.product, customer:req.body.customer})){
        if(req.headers.authorization == 'cashier'){
            db.newOrder(req.body.product, req.body.customer).then((data)=>{
                if(data.err) res.json({alert:data.alert,err:data.err});
                else res.json({alert:data.alert, id:data.rows[0].id});
            });
        }
        else res.json({alert:'Only cashiers can add new orders',err:{
                "name": "error",
                "severity": "ERROR",
                "code": "422",
                "text": "Bad role for this operation"
            }});
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(authorization header(string)), product(number), customer(string)"
        }});
});

router.post('/confirm_order', (req, res)=>{
    if(req.headers.authorization && req.body.id && validation({role:req.headers.authorization, id:req.body.id})){
        if(req.headers.authorization == 'bearer'){
            db.confirmOrder(req.body.id).then((data)=>{
                if(data.err) res.json({alert:data.alert,err:data.err});
                else res.json({alert:data.alert, id:data.rows});
            });
        }
        else res.json({alert:'Only bearers can confirm orders',err:{
                "name": "error",
                "severity": "ERROR",
                "code": "422",
                "text": "Bad role for this operation"
            }});
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(authorization header(string)), id(number)"
        }});
});

router.post('/generate_invoice', (req, res)=>{
    if(req.headers.authorization && req.body.id && validation({role:req.headers.authorization, id:req.body.id})){
        if(req.headers.authorization == 'cashier'){
            db.invoice(req.body.id).then((data)=>{
                if(data.err) res.json({alert:data.alert,err:data.err});
                else {
                    if(new Date() - data.rows[0].product_created_date > 2592000000){
                        data.rows[0].coefficients += 0.2
                    }
                    data.rows[0].full_price = data.rows[0].price;
                    data.rows[0].discount = data.rows[0].coefficients * 100 + '%';
                    data.rows[0].price *= 1 - data.rows[0].coefficients;
                    data.rows[0].product_created_date = undefined;
                    data.rows[0].coefficients = undefined;
                    res.json({alert:data.alert, invoice:data.rows[0]});
                }
            });
        }
        else res.json({alert:'Only cashiers can generate invoice',err:{
                "name": "error",
                "severity": "ERROR",
                "code": "422",
                "text": "Bad role for this operation"
            }});
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(authorization header(string)), id(number)"
        }});
});

router.post('/confirm_payment', (req, res)=>{
    if(req.headers.authorization && req.body.id && validation({role:req.headers.authorization, id:req.body.id})){
        if(req.headers.authorization == 'cashier'){
            db.confirmPayment(req.body.id).then((data)=>{
                if(data.err) res.json({alert:data.alert,err:data.err});
                else res.json({alert:data.alert});
            });
        }
        else res.json({alert:'Only cashiers can confirm payment',err:{
                "name": "error",
                "severity": "ERROR",
                "code": "422",
                "text": "Bad role for this operation"
            }});
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(authorization header(string)), id(number)"
        }});
});

router.post('/get_orders', (req, res)=>{

});

router.get('/orders_for_receipt', (req, res)=>{
    if(req.headers.authorization && validation({role:req.headers.authorization})){
        if(req.headers.authorization == 'bearer'){
            db.forRecipt().then((data)=>{
                if(data.err) res.json({alert:data.alert,err:data.err});
                else res.json({alert:data.alert, orders:data.rows});
            });
        }
        else res.json({alert:'Only bearers can select created orders',err:{
                "name": "error",
                "severity": "ERROR",
                "code": "422",
                "text": "Bad role for this operation"
            }});
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(authorization header(string))"
        }});
});

function validation(fields){
    if(fields.role != undefined){
        if(fields.role != 'bearer' && fields.role != 'cashier' && fields.role != 'accountant') return false;
    }
    if(fields.id != undefined){
        if(!fields.id || typeof fields.id != "number") return false;
    }
    if(fields.product != undefined){
        if(!fields.product || typeof fields.product != "number") return false;
    }
    if(fields.customer != undefined){
        if(!fields.customer) return false;
    }
    if(fields.created != undefined){
        if(!fields.created || !new Date(fields.created).getFullYear()) return false;
        if(fields.invoice != undefined){
            if(!fields.invoice || !new Date(fields.invoice).getFullYear()) return false;
        }
    }
    return true;
}

module.exports = router;