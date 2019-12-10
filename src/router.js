const router = require('express').Router();
const db = require('./db');

router.all('*', (req, res)=>{
    res.json({'success':validation(req.body)});
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