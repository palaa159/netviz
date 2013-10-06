var connect = require('connect'),
	fs = require('fs'),
	util = require('util'),
	io = require('socket.io').listen(9001), // WS port
	port = 9000, // HTTP port
	exec = require('child_process').exec,
	colors = require('colors'),
	child;

// SET COLOR THEMES –––––––––––––––––––––––––––––––––––––––––––––––

colors.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

// END OF COLOR THEMES –––––––––––––––––––––––––––––––––––––––––––––––

// SETTING UP WEB SERVER –––––––––––––––––––––––––––––––––––––––––––––

connect.createServer(
	connect.static(__dirname + '/public') // two underscores
).listen(port);
util.log('the server is running on port: ' + port);

// END OF WEB SERVER –––––––––––––––––––––––––––––––––––––––––––––––

// SOCKET.IO –––––––––––––––––––––––––––––––––––––––––––––––
io.set('log level', 1);
io.sockets.on('connection', function(socket) {
	util.log('Ooooooh, someone just poked me :)');
});

// END OF S.IO –––––––––––––––––––––––––––––––––––––––––––––––

// exec airodump
var file = 'test';
child = exec('sudo airodump-ng mon0 -u 2 -w ./cap/' + file + ' -o csv', {
	maxBuffer: 20000*1024
}, function() {

});

// FIND THE RIGHT FILE PATH FOR LATEST CAP ––––––––––––––––––––––––
var corrFilePath;
fs.readdir('./cap', function(err, files) {
	if(err) throw err;
	console.log(files);
	corrFilePath = './cap/' + file + '0';
});

// watch file change
fs.watchFile(corrFilePath, function(curr, prev) {
	// read .csv then parse it to user in UTF-8
	fs.readFile(corrFilePath, 'utf-8', function(err, data) {
		if(err) throw err;
		console.log(data);
		io.sockets.emit('data', data);
	});
});

