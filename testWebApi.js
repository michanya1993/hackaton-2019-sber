const axios = require('axios');
const consts = require('./consts');

const URL = 'http://localhost:';
const PORT_WEB = consts.PORT_WEB;


const data = {
    car: 1,
};

axios({
  method: 'get',
  url: `${URL}${PORT_WEB}/result/savePoint`,
  data: data,
  //timeout: 1000,
})
.then(function (response) {
  //console.log(response);
  console.log('API recive OK');
})
.catch(function (error) {
  //console.log(error);
  console.log('API recive FAIL');
});;