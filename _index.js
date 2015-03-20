var _CONFIG = {
	favicon : '/favicon.ico'
	, extension : '.json'
	, path : '/endpoint/'
	, port : 9999
	, host : 'localhost'
	, protocol : 'http' // http or https
	, certificate : '/etc/ssl/certificate.pem'
	, useBackend : false
	, fallback : false
};
var testingFunction = function(connection){
    connection.response.writeHead(200, {"Content-Type": "text/plain"});
    connection.response.end("Hello World\n");
};

// ------------------------------------------------
// * Required for HTTPS Support
// ------------------------------------------------
// if(_CONFIG.protocol === 'https'){
// 	var options = {
// 		key: fs.readFileSync(_CONFIG.certificate)
// 		, cert: fs.readFileSync(_CONFIG.certificate)
// 	};
// }

var session = [];

var fs = require('fs');
var url = require('url');
var events = require('events');
var eventEmitter = new events.EventEmitter();

// ------------------------------------------------
// * Options required for HTTPS Support
// ------------------------------------------------
var server = require(_CONFIG.protocol).createServer( /* options, */ function(req, res){
	var connection = {
		response : res
		, url : url.parse(req.url).pathname
		, method : req.method
		, body : ''
		, status : 0
		, results : ''
		, base : __dirname + _CONFIG.path
		, folder : {
			path : ''
			, resource : ''
			, files : []
			, tmp : []
		}
		, log : {
			request : ''
			, response : ''
		}
	};
	// Gather up chunked data passed in a POST
	req.on('data', function(chunk) {
		connection.body += chunk.toString();
	});
	// Once finished proceed with the Request
	req.on('end', function() {
        // testingFunction(connection); return;
        eventEmitter.emit('processRequest', connection);
	});
}).listen(_CONFIG.port, _CONFIG.host);

eventEmitter.on('processRequest'
	, function(connection){
        // testingFunction(connection); return;
		// Suppress the favicon
		if(connection.url.indexOf(_CONFIG.favicon) === -1){
			// If url begins with / remove it
			if(connection.url.charAt(0) === '/'){
				connection.url = connection.url.slice(1);
			}
			// If url ends with / remove it
			if(connection.url.charAt(connection.url.length - 1) === '/'){
				connection.url = connection.url.slice(0, connection.url.length - 1);
			}
			connection.folder.path = connection.url;
			// ------------------------------------------------
			// * Support the different HTTP Verbs
			// ------------------------------------------------
			/*
			var request = {};
			switch(connection.method.toUpperCase()){
				//case 'GET':
				//case 'PUT':
				//case 'DELETE':
				case 'POST':
					try{
						request = JSON.parse(connection.body);
					}
					catch(error){

					}
				break;
				default:
					eventEmitter.emit('gatherJSON', connection);
				break;
			}
			*/
			eventEmitter.emit('gatherJSON', connection);
		}
		else{
			// Return a 410 for favicon
			connection.status = 410;
			connection.results = 'Thou shall not request favicons.';
			eventEmitter.emit('httpResponse', connection);
		}
	}
);

eventEmitter.on('gatherJSON'
	, function(connection){
        // testingFunction(connection); return;
        fs.readdir(connection.base + connection.folder.path, function(err, files){
			connection.folder.tmp = connection.folder.path.split('/');
			connection.folder.tmp.pop();
			if(!err){
				for(var i in files){
					// Check file type is JSON
					if(files[i].indexOf(_CONFIG.extension) !== -1 && files[i].length >= _CONFIG.extension.length && files[i].indexOf(_CONFIG.extension, files[i].length - _CONFIG.extension.length) !== -1){
						connection.folder.files.push(files[i]);
					}
				}
				// If no files are found in the folder and there is another folder to check recuse
				if(connection.folder.files.length === 0 && connection.folder.tmp.length !== 0){
					connection.folder.path = connection.folder.tmp.join('/');
					eventEmitter.emit('gatherJSON', connection);
					return;
				}
			}
			else if(connection.folder.tmp.length !== 0){
				// If an error occured and there is another folder to check recuse
				connection.folder.path = connection.folder.tmp.join('/');
				eventEmitter.emit('gatherJSON', connection);
				return;
			}
			// Done recusing move on to reading the JSON files
			eventEmitter.emit('processJSON', connection);
		});
	}
);

eventEmitter.on('processJSON'
	, function(connection){
        // testingFunction(connection); return;
        var exists = false;
		var entry = {
			maxResults: 0
			, counter: -1
			, method: connection.folder.path
			, files: []
		};
		if(_CONFIG.useBackend){
            eventEmitter.emit('backendRequest', connection);
		}
		else{
			// If there are results process through them
			if(connection.folder.files.length > 0 && connection.folder.path !== ''){
				for(var i in session){
					// Check if this request is in session
					if(session[i].method === entry.method){
						// If the contents of the folder have changed reset session entry
						if(connection.folder.files.length !== session[i].maxResults){
							session[i].maxResults = connection.folder.files.length;
							session[i].counter = -1;
							session[i].files = connection.folder.files.slice(0);
						}
						exists = i;
						break;
					}
				}
				// If request wasn't in session add it
				if(exists === false){
					entry.maxResults = connection.folder.files.length;
					entry.files = connection.folder.files.slice(0);
					session.push(entry);
					exists = session.length - 1;
				}
				// Check session has valid max results
				if(session[exists].maxResults > 0){
					if(connection.folder.files.length === 1){
						// If a single file in the folder just serve it regardless of its name
						//connection.folder.resource = connection.base + connection.folder.path + '/' + connection.folder.files[0];
						connection.folder.resource = connection.base + connection.folder.path + '/' + session[exists].files[0];
					}
					else{
						// If multiple files are in the folder iterate counter and serve the #.json
						session[exists].counter = (session[exists].counter >= (session[exists].maxResults - 1) ) ? 0 : session[exists].counter + 1;
						//connection.folder.resource = connection.base + connection.folder.path + '/' + session[exists].counter + _CONFIG.extension;
						connection.folder.resource = connection.base + connection.folder.path + '/' + session[exists].files[session[exists].counter];
					}
					eventEmitter.emit('fetchJSON', connection);
				}
			}
			else{
				if(_CONFIG.fallback){
					eventEmitter.emit('backendRequest', connection);
				}
				else{
					// No results found
					connection.status = 404;
					connection.results = 'No results found for the endpoint ["'+ connection.url +'"].';
					eventEmitter.emit('httpResponse', connection);
				}
			}
		}
	}
);

eventEmitter.on('fetchJSON'
	, function(connection){
        // testingFunction(connection); return;
        fs.readFile(connection.folder.resource, 'utf8', function(err, data){
			if(!err){
				// Successfully serve the requested JSON file
				connection.status = 200;
				connection.results = data;
				eventEmitter.emit('httpResponse', connection);
			}
			else{
				// Error when serving the requested JSON file
				console.log('****************************************************************************');
				console.log('An exception occurred while loading the resource ["' + connection.folder.resource + '"].');
				console.log('----------------------------------------------------------------------------');
				console.log(err);
				console.log('****************************************************************************');
				connection.status = 500;
				connection.results = 'An exception occurred while loading the resource ["' + connection.folder.resource + '"].';
				eventEmitter.emit('httpResponse', connection);
			}
		});
	}
);

eventEmitter.on('backendRequest'
	, function(connection){
        // testingFunction(connection); return;
        var options = {
			//timestamp: new Date().getTime()
			 host: 'localhost'
			, port: 8888
			, path: connection.url
			, method: connection.method
			//, body: connection.body
			, headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': connection.body.length
			}
		};
		var http = require('http');
        try {
            var _request = http.request(options, function (_response) {
                var data = '';
                var error;
                _response.setEncoding('utf8');
                _response.on('data', function (chunk) {
                    data += chunk;
                    console.log("here", chunk);
                });
                _response.on('error', function (err) {
                    error = err;
                });
                _response.on('end', function () {
                    /*
                    var response = {
                        timestamp: new Date().getTime(), status: _response.statusCode, error: error, data: data
                    };
                    try {
                        connection.log.request = JSON.stringify(options, null, '\t');
                        connection.log.response = JSON.stringify(response, null, '\t');
                        eventEmitter.emit('log', connection.log.request, connection.log.response);
                    }
                    catch (exception) {
                        console.log(exception);
                    }
                    connection.status = response.statusCode;
                    connection.results = response.error ? response.error : response.data;
                    eventEmitter.emit('httpResponse', connection);
                    */
                    console.log("Response");
                });
            });
            //_request.write(options.body);
            _request.end();
        } catch (e) {
            console.log("here", e);
        }
	}
);

eventEmitter.on('httpResponse'
	, function(connection){
        // testingFunction(connection); return;
        var status = connection.status || 0;
		var results = connection.results || '';
		connection.response.writeHead(
			status
			, [
				// Allow CORS Requests
				['Access-Control-Allow-Origin', '*']
				// Serve the Results as JSON
				, ['Content-Type', 'application/json']
			]
		);
		connection.response.write(results);
		connection.response.end();
	}
);


eventEmitter.on('log'
	, function(request, response){
		var log = 'api.log';
		var section = '// *****************************************************************************';
		var divider = '// -----------------------------------------------------------------------------';
		var message = '';
		message += section + '\n\n' + 'REQUEST:\n' + request + '\n\n' + divider + '\n\n' + 'RESPONSE:\n' + response + '\n\n' + section + '\n\n\n\n';
		fs.exists(log, function(exists){
			if(exists){
				fs.appendFile(log, message, function(err) {
					if(err){
						console.log(err);
					}
				});
			}
			else{
				fs.writeFile(log, message, function(err) {
					if(err){
						console.log(err);
					}
				});
			}
		});
	}
);

console.log('****************************************************************************');
console.log('API Server Started at ' + _CONFIG.protocol + '://' + _CONFIG.host + ':' + _CONFIG.port + '');
console.log('****************************************************************************');