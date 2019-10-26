const axios = require('axios');
const consts = require('./consts');

const API_URL = consts.HOST_API;
const API_PORT = consts.PORT_API;


function sendGraph(graph) {

    console.log('API-TO Send to graph');
    //console.log(JSON.stringify(graph));

    axios({
      method: 'get',
      url: `${API_URL}${API_PORT}/graph/reciveNewGraphSocket`,
      data: graph,
      //timeout: 3,
    })
    .then(function (response) {
      //console.log(response);
      console.log('API-FROM recive graph OK');
    })
    .catch(function (error) {
      console.log(error.response);
      console.log('API-FROM recive graph FAIL');
    });;

    return true;
}

function sendCars(cars) {

    console.log('API-TO Send to API cars = ', cars.length);
    //console.log(JSON.stringify(cars));

    axios({
      method: 'get',
      url: `${API_URL}${API_PORT}/graph/reciveCarSocket`,
      data: cars,
      //timeout: 3,
    })
    .then(function (response) {
      //console.log(response);
      console.log('API-FROM recive cars OK');
    })
    .catch(function (error) {
      console.log(error.response);
      console.log('API-FROM recive cars FAIL');
    });;

    return true;
}

module.exports = {
  sendGraph: sendGraph,
  sendCars: sendCars,
};