var http = require('http'),
	db = require('./model/db'),
	pages = require('./pages');

http.createServer(function (req, res) {
  	pages.index(req, res);

}).listen(process.env.PORT || 8080);