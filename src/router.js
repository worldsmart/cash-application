const router = require('express').Router();
const db = require('./db');

router.post('/add_order', (req, res)=>{
    if(req.body.role && req.body.product && req.body.customer && validation({role:req.body.role, product:req.body.product, customer:req.body.customer})){
        db.newOrder(req.body.product, req.body.customer).then((data)=>{
            if(data.err) res.json({alert:data.alert,err:data.err});
            else res.json({alert:data.alert, id:data.rows[0].id});
        });
    }
    else res.json({alert:'Request was rejected due to poor input',err:{
            "name": "error",
            "severity": "ERROR",
            "code": "422",
            "text": "Required fields: role(string), product(number), customer(string)"
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