'use strict';

const express = require('express');
const parser = require('body-parser');
const app = express();
const config = require('./configuration');
const port = process.env.PORT || 3000;
const issuer = config.issuer;
const jwt             = require('express-jwt'),
        jwksClient      = require('jwks-rsa');

const firebase = require('firebase');
const config = require('./config-firebase')

firebase.initializeApp(config);

const auth = jwt({
    secret: jwksClient.expressJwtSecret({
        cache: true,        // see https://github.com/auth0/node-jwks-rsa#caching
        rateLimit: true,    // see https://github.com/auth0/node-jwks-rsa#rate-limiting
        jwksRequestsPerMinute: 10,
        jwksUri: `${issuer}/.well-known/openid-configuration/jwks`      // we are hardcoding the default location of the JWKS Uri here - but another approach is to get the value from the discovery endpoint
    }),

    // validate the audience & issuer from received token vs JWKS endpoint
    audience: config.audience,
    issuer: issuer,
    algorithms: ['RS256']
});


app.use(parser.urlencoded({extended : true}));

app.get("/:id", auth, (req,resp) => {
    var h = {
        "Content-type" : "application/json",
        "x-cross" : "Igor"
    }
    const id = req.params.id;
    resp.status(200).header(h).json({ teste : 1, id : parseInt(id)});
});

app.get("/", (req,resp) => {
    var h = {
        "Content-type" : "application/json",
        "x-cross" : "Igor"
    }
    firebase.database().ref('/TestMessages').set({TestMessage: 'GET Request 2'});
    resp.status(200).header(h).json({ teste : 1});
});

app.get('/users/:user', (req,resp) => {
    const user = req.params.user;

    firebase.database().ref(`/Users/${user}`).on('value', (snapshot) => {
        if(snapshot.val() == null || snapshot.val() === undefined)
        {
            resp.status(404).json({message : 'Not found'});
            return;
        }
        resp.json(snapshot.val());
        
    },
    (error) => {
        resp.status(500).json(error);
    });
});

app.post('/users', auth, (req, resp) => {
    firebase.database().ref("/Users").set(req.body);

    resp.send('Updated Ok');
});

app.post('/users/:user', auth, (req,resp) => {
    firebase.database().ref(`/Users/${req.params.user}`).set(req.body);
    resp.status(201).json({success : true});
});

var server = app.listen(port, () => {
    var port = server.address().port;
    var host = server.address().address;
    console.log(server.address());
    console.log("http://%s:%s online", host, port);
});