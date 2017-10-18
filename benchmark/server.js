var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app);

var port = process.env.PORT || 8100,
    host = process.env.HOST || "localhost";

console.log("initializing server ");

// ivastack libs
let libs = {
    i2v: '../node_modules/i2v/src',
    // flexgl : '../../node_modules/flexgl/src',
    p4: '../../src',
}

// Static files
Object.keys(libs).forEach(function(lib){
    app.use('/'+lib, express.static(libs[lib]));
})

app.use("/npm", express.static('../node_modules'));
app.use("/src", express.static('../src'));
app.use(express.static('.'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
