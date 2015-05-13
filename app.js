var http = require('http'),
	express = require('express'),
	db = require('./model/db'),
	pages = require('./pages'),
	app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/html'));

app.get('/api*', function(request, response) {
  pages.index(request, response);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});