const consts = require('./consts');

const express = require('express');
const app = express()
const PORT_WEB = consts.PORT_WEB;


app.get('/', (request, response) => {
    response.send('Hello from Express!')
});

app.post('/result/savePoint', (request, response) => {
    console.log(request.stack);
    console.log(request.stack);
    console.log(request.originalUrl);
    response.send('')
});


app.get('/result/savePoint', (request, response) => {

    const { car, point } = request.query;

    console.log(request.query);
    console.log('car, point',car, point);

    response.send('')
});

app.listen(PORT_WEB, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${PORT_WEB}`)
})