var ENUMS = {
    favicon : '/favicon.ico'
    , extension : '.json'
    , path : '/endpoint/'
    , unsecure : {
        protocol : 'http'
        , port : 9999
        , host : 'localhost'
    }
    , secure : {
        protocol : 'https'
        , port : 9443
        , host : 'localhost'
        , certificate : '/etc/ssl/certificate.pem'
    }
    , useBackend : false
    , fallback : false
};

var fs = require('fs');
var url = require('url');
var http = require('http');
var https = require('https');
var events = require('events');
var querystring = require('querystring');
var eventEmitter = new events.EventEmitter();

function Connection(req, res){
    req = req || {};
    this.response = res;
    this.request = {
        method: req.method || ''
        , headers: req.headers || {}
        , url: url.parse(req.url) || {}
        , body: ''
        , raw : {
            url: req.url
            , body: ''
        }
        , extra: {
            scheme: ''
            , authentication: {
                username: ''
                , password: ''
            }
            , host: {
                subdomains: []
                , domain: ''
                , toplevel: ''
            }
            , port: ''
            , path: ''
            , query: ''
            , parameters: []
            , file: ''
            , fragment: ''
        }
    };
    this.status = 0; //
    this.result = ''; //
    this.type = ''; // 'application/json' || 'text/plain' || 'text/html' || 'image/png'

    //, base : __dirname + ENUMS.path
    //, folder : {
    //    path : ''
    //    , resource : ''
    //    , files : []
    //    , tmp : []
    //}
    //, log : {
    //    request : ''
    //    , response : ''
    //}
}

function onRequest(req, res) {
    var connection = new Connection(req, res);
    var data, raw = '';
    // Gather up chunked data passed in a POST
    req.on('data', function (chunk) {
        raw += chunk;
        data += chunk.toString();
        if(raw.length > 1e6) {
            connection.status = 413;
            connection.result = 'Thou shall not flood the server.';
            eventEmitter.emit('httpResponse', connection);
        }
    });
    // Once finished proceed with the Request
    req.on('end', function () {
        connection.request.raw.body = querystring.parse(raw);
        connection.request.body = querystring.parse(data);
        connection.runtime = {};
        eventEmitter.emit('processRequest', connection);
    });
}

var server;
var configuration = {
    type : ''
    , server : {}
};

switch((process.argv[2] || '').toLowerCase()){
    case 'secure':
    case 'unsecure':
        configuration.type = process.argv[2].toLowerCase();
        break;
    default:
        configuration.type = 'unsecure';
        break;
}

configuration.server = ENUMS[configuration.type];

if(configuration.type.toLowerCase() === 'unsecure'){
    server = http.createServer(onRequest);
}
else{
    configuration.options = {
        key : fs.readFileSync(configuration.server.certificate)
        , cert : fs.readFileSync(configuration.server.certificate)
    };
    server = https.createServer( configuration.server.options, onRequest);
}
server.listen(configuration.server.port, configuration.server.host)



eventEmitter.on('processRequest' , function(connection){
    var path = connection.request.url.pathname;
    // Suppress the favicon
    if(path.indexOf(ENUMS.favicon) !== -1) {
        // Return a 410 Gone - Indicates that the resource requested is no longer available and will not be available again
        connection.status = 410;
        connection.result = 'Thou shall not request favicons.';
        eventEmitter.emit('httpResponse', connection);
    }
    else{
        // If url begins with / remove it
        if(path.charAt(0) === '/'){
            path = path.slice(1);
        }
        // If url ends with / remove it
        if(path.charAt(path.length - 1) === '/'){
            path = path.slice(0, path.length - 1);
        }
        connection.runtime.path = path;
        connection.runtime.request = connection.request;

        connection.status = 200;
        connection.result = JSON.stringify(connection.runtime);
        eventEmitter.emit('httpResponse', connection);
    }
});




eventEmitter.on('httpResponse' , function(connection){
    var status = connection.status || 0;
    var result = connection.result || '';
    connection.response.writeHead(
        status
        , [
            // Allow CORS Requests
            ['Access-Control-Allow-Origin', '*']
            , ['Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept']
            // Access-Control-Allow-Methods: POST, GET, OPTIONS
            // Serve the Results as JSON
            , ['Content-Type', 'application/json']
        ]
    );

    connection.response.write(result);
    // connection.response.write(file, 'binary');
    connection.response.end();
});