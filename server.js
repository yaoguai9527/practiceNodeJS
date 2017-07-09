/**
 * Created by chuanghuang on 7/4/17.
 */
var http = require('http');
var fs   = require('fs');
var path = require('path');
var mine = require('mime');

var cache= {};

var chatServer = require('./lib/chat_server');

//create http server
var server = http.createServer(function (request, response) {
    var filePath = false;

    if(request.url == '/'){
        //Determine HTML file to be served by default
        filePath = 'public/index.html';
    }else {
        //Translate URL path to relative file path
        filePath = 'public' + request.url;
    }

    var absPath = './' + filePath;
    //Serve the static file
    serveStatic(response, cache, absPath);
});

chatServer.listen(server);

server.listen(3000, function () {
    console.log("Server listening on port 3000");
})

function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

function sendFile(response, filePath, fileContent) {
    response.writeHead(
        200,
        {"content-type": mine.lookup(path.basename(filePath))}
    );
    response.end(fileContent);
}

function serveStatic(response, cache, absPath) {
    //Check if the file is cached in memory
    if(cache[absPath]){
        //Serve file from memory 
        sendFile(response,absPath, cache[absPath]);
    }else{
        //check if file exist
        fs.exists(absPath, function (exists) {
            if(exists){
                //Read file from disk
                fs.readFile(absPath, function (err, data) {
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath] = data;
                        //Serve file read from disk
                        sendFile(response, absPath, data);
                    }
                });
            }else {
                //Send HTTP 404 response
                send404(response);
            }
        });
    }
}