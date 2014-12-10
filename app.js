// npm
var phridge = require('phridge'),
    express = require('express');

// local
var phantom = require('./app/phantom'),
    settings = require('./app/settings');

// OpenShift ready port/ip
var port = process.env.OPENSHIFT_NODEJS_PORT || settings.port,
    ip = process.env.OPENSHIFT_NODEJS_IP;

// set up express, routes, middleware
var app = express();
require('./app/routes.js')(app, express);

// spawn some phantom!
phridge.spawn().then(function (process) {
    phantom.process = process;
    app.listen(port, ip);
});