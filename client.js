#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
const consts = require('./consts');
const edgeDtos = require('./test');
const apiGraph = require('./api');

const express = require('express');
const app = express()
const PORT_WEB = consts.PORT_WEB;

var client = new WebSocketClient();

const PORT_WS = consts.PORT_WS;
const HOST_WS = consts.HOST_WS;

let TOKEN = null;
let CARS = [];

let FIRST_DATA = {
    hasCars: false,
    hasRoutes: false,
    hasTraffic: false,
    hasPoints: false,
};

let ROUTES = null;
let TRAFFIC = null;
let POINTS = null;

let GRAPH = {};

let CNT_WS = 0;
let CNT_API = 0;

function registerSession(data) {
    TOKEN = data.token;
    console.log('WS-FROM  Set token', TOKEN);

    CARS = data.cars;
    console.log('WS-FROM Set cars', CARS);

    const req = CARS
        .map( car => {
            return {
                car,
                time: null,
            };
        });

    apiGraph.sendCars(req);

    FIRST_DATA.hasCars = true;
    //console.log('Flags', FIRST_DATA);

    haveInitialData();

}

function setRoutes(data) {

    FIRST_DATA.hasRoutes = true;
    ROUTES = data.routes;

    console.log('WS-FROM Set routes = ', ROUTES.length);
    //console.log('Flags', FIRST_DATA);

    return haveInitialData();
}
function setTraffic(data) {

    FIRST_DATA.hasTraffic = true;
    TRAFFIC = data.traffic;
    console.log('WS-FROM Set traffic = ', TRAFFIC.length);
    //console.log('Flags', FIRST_DATA);

    return haveInitialData();

}
function setPoints(data) {

    FIRST_DATA.hasPoints = true;
    POINTS = data.points;
    console.log('WS-FROM Set points = ', POINTS.length);
    //console.log('Flags', FIRST_DATA);

    return haveInitialData();

}

function haveInitialData() {

      const {
        hasCars,
        hasRoutes,
        hasTraffic,
        hasPoints,
    } = FIRST_DATA;

    if (hasCars && hasRoutes && hasTraffic && hasPoints) {

        console.log('We have data for graph');

        const graph = createInitialGraph();

        const apiRsp = apiGraph.sendGraph(graph);

        return true;

    }
    return false;
}


function carDone(data) {
    CNT_WS++;
    console.log('WS-FROM Get one car cnt = ', CNT_WS);

    const req = [{
        car: data.car,
        time: data.duration, //TODO УКАЗАТЬ ВРЕМЯ КОГДА БУДЕТ ИЗВЕСТНО
    }];

    const apiRsp = apiGraph.sendCars(req);

    return true;
}

function graphCreateEdge(edge) {
//"routes":[{"a":0,"b":1,"time":15}
//"points":[{"p":0,"money":0},
//"traffic":[{"a":0,"b":1,"jam":"1.46"},

    const nodeTypePoint = node => node === 0 ? 'GARAGE' : node === 1 ? 'BANK' : 'INKASS_POINT';

    const nodeMoney = node => POINTS
        .filter( a => a.p === node )
        .map( a => a.money )[0];

    const edgeJam = (nodeA, nodeB) => TRAFFIC
        .filter( edge => edge.a === nodeA && edge.b === nodeB)
        .map( a => a.jam )[0];

    return {
     from: {
       name: edge.a,                    //points.a
       timeInPoint: 0,                  // время загрузки / разгрузки  || 0
       typePoint: nodeTypePoint(edge.a),//0 - GARAGE,1 BANK, n - INKASS_POINT
       sum: nodeMoney(edge.a),          //points.money
     },
     to: {
       name: edge.b,
       timeInPoint: 0,                   //0
       typePoint: nodeTypePoint(edge.b), //0 - GARAGE,1 BANK, n - INKASS_POINT
       sum: nodeMoney(edge.b),          //points.money
     },
     wayInfo: {
       timeInWay: edge.time,             //routes.time
       pheromone: null,                  //null
       trafficKoef: edgeJam(edge.a, edge.b),  //traffic.jam
       weightWay: null                   //null
     }
    }
}

function createInitialGraph() {

    console.log('Created new graph');

    const edges = ROUTES
        .map( edge => {

            return graphCreateEdge(edge);

        });

    return {
        edgeDtos: edges,
    };

}

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {

            const rawData = message.utf8Data;

            //console.log("Received: '" + rawData + "'");

            try {
                var json = JSON.parse(rawData);
                processMsg(json);
            } catch (e) {
                console.log('Client: error parsing rsp ', rawData);
                console.log(e);
                return;
            }

        }
    });

    app.get('/result/savePoint', (request, response) => {
        const { car, point } = request.query;
        console.log(`WEB-REST Get car=${car}, point=${point}`);
        sendGoto(car, point);
        response.send('0');
    });

    app.listen(PORT_WEB, (err) => {
        if (err) {
            return console.log('something bad happened', err)
        }
        console.log(`WEB server is listening on ${PORT_WEB}`)
    })


    function recon() {
       let msg = { reconnect: TOKEN };
       console.log("reconnect ws ", TOKEN);
       connection.sendUTF(JSON.stringify(msg));
    }

    function openSession() {
        if (connection.connected) {

            let msg = { "team": "Наш корабль плывет отлично"};
            console.log("WS-TO Send to srv our team");

            connection.sendUTF(JSON.stringify(msg));
        }
    }

    function sendGoto(car, point) {
        if (connection.connected) {

            let msg = { "goto": point, "car": car };
            CNT_API++;
            console.log("WS-TO send goto cnt = ", CNT_API);

            connection.sendUTF(JSON.stringify(msg));
        }
    }

    function processMsg(json) {

        const { token, routes, traffic, points, point, teamsum, } = json;

        let result = false;

        if ( token ) {
            result = registerSession(json);
            return true;
        }

        if ( routes ) {
            result = setRoutes(json);
           return true;
        }

        if ( traffic ) {
            result = setTraffic(json);
            return true;
        }

        if ( points ) {
            result = setPoints(json);
            return true;
        }

        if ( point ) {
            result = carDone(json);
            return true;
        }

        if ( teamsum ) {

            console.log('WS-FROM Get teamsum ', teamsum);

            return true;
        }

        console.log('WS-FROM WTF ?');

    }

    openSession();

});
console.log(HOST_WS+PORT_WS);
client.connect(HOST_WS+PORT_WS, 'echo-protocol');