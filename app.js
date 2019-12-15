const express = require('express'); //Подгружаю модуль экспрес
const bodyParser = require('body-parser'); //Боди парсер

const port = 80;//Прописываю заранее порт

const app = express();//Создаю экземпляр экспрес приложения

app.use(bodyParser.json());//использую боди парсер

const router = require('./src/router');//Подгружаю модуль роутера
app.all('*', router);//Использую роутер

app.listen(port, ()=>{//Помещаю сервер на 80 порт
    console.log('Server started on port: ' + port);//Лог для наглядности
});