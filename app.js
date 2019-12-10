const express = require('express');
const bodyParser = require('body-parser');

const port = 80;

const app = express();

app.use(bodyParser.json())

const router = require('./src/router');
app.all('*', router);

app.listen(port, ()=>{
    console.log('Server started on port: ' + port);
});