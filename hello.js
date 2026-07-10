var http = require('http');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello from iisnode! Node is working perfectly.\n');
}).listen(process.env.PORT);
