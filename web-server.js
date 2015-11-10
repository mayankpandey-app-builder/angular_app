var express = require('express'),
    http = require('http'),
    request = require('request');
var path = require('path');
var app = express();

app.configure(function(){
    app.use(express.static(__dirname + '/'));
    console.log(__dirname);
});


app.use(app.router);
app.use(function(req, res) {
    // Use res.sendfile, as it streams instead of reading the file into memory.
    var p = path.resolve(__dirname + '/index.html');
    res.sendfile(p);
});
app.all('/proxy', function(req, res) {
    var url = req.header('SalesforceProxy-Endpoint');
    console.log("proxying: " + url);
    request({ url: url, headers: {'Authorization': req.header('X-Authorization')} }).pipe(res);
});

http.createServer(app).listen(8000);
console.log('server started at http://localhost:8000');
