var http = require('http');
var Xray = require('x-ray');
var phantom = require('x-ray-phantom');
var fs = require('fs');

// begin scraper

var xray = new Xray();

xray('http://websta.me/tag/tokyotower/', 'div',
  [{thing: ''}]
).write('results.json');

var contents = fs.readFile('results.json', 'utf-8');
console.log(contents);

// end scraper
// begin server

var port = 80;

function handleRequest(request, response) {
	
  var page = '<html><body>';
  
  page += 'Done!';
  
	response.end(page + '</body></html>');
	
}

var server = http.createServer(handleRequest);

server.listen(port, function(){
	
	console.log("Server listening on port " + port);
	
})

// end server
