var connect = require('connect'),
	fs = require('fs'),
	util = require('util'),
	io = require('socket.io').listen(9001), // WS port
	port = 9000, // HTTP port
	exec = require('child_process').exec,
	colors = require('colors'),
	os = require('os'),
	ifaces = os.networkInterfaces(),
	pcap = require("pcap"),
	idev = 'wlan0',
	matcher = /safari/i,
	tcp_tracker = new pcap.TCP_tracker(),
	pcap_session = pcap.createSession(idev, "tcp"),
	child, ip;

// Find ip of server
for (var dev in ifaces) {
	var alias = 0;
	ifaces[dev].forEach(function(details) {
		if (details.family == 'IPv4' && details.internal == false) {
			ip = details.address;
			// console.log(details.address);
		}
	});
}

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
io.set('log level', 2);
io.sockets.on('connection', function(socket) {
	util.log('Ooooooh, someone just poked me :)');
	socket.on('register', function(data) {
		var username = data.username,
			email = data.email,
			ip = socket.handshake.address.address;
		console.log(username, email, ip);
	});
});

// END OF S.IO –––––––––––––––––––––––––––––––––––––––––––––––

// pcap matches mac address and user input his/her name to represent that mac, no evil at all.
pcap_session.on('packet', function(raw_packet) {
	var packet = pcap.decode.packet(raw_packet),
		src_ip = packet.link.ip.saddr,
		// src_port = packet.link.ip.tcp.sport,
		dst_ip = packet.link.ip.daddr,
		dst_port = packet.link.ip.tcp.dport,
		// data_byte = packet.link.ip.tcp.data_bytes,
		data = packet.link.ip.tcp.data;

		if(dst_ip == ip && matcher.test(data.toString())) { // if true // or maybe scan port 9001
			// match ip and macaddress = that userX
		}
		// 
});

// exec airodump with 5 second interval
var file = 'test';

function airodump() {
	child = exec('sudo airodump-ng mon0 -u 5 -w ./cap/' + file + ' -o csv', {
		maxBuffer: 20000 * 1024
	}, function() {

	});
}

// FIND THE RIGHT FILE PATH FOR LATEST CAP ––––––––––––––––––––––––
var corrFilePath;
fs.readdir('./cap', function(err, files) {
	if (err) throw err;
	console.log(files.length);
	if (files.length <= 9) {
		corrFilePath = './cap/' + file + '-0' + files.length + '.csv';
		// console.log('file path: ' + corrFilePath);
		watchChange(corrFilePath);
	} else {
		corrFilePath = './cap/' + file + '-' + files.length + '.csv';
		// console.log('file path: ' + corrFilePath);
		watchChange(corrFilePath);
	}
});

// watch file change

function watchChange(a) {
	fs.watchFile(a, function(curr, prev) {
		// read .csv then parse it to user in UTF-8
		fs.readFile(corrFilePath, 'utf-8', function(err, data) {
			if (err) throw err;
			var quote = '"';
			var client = data.substring(data.indexOf('Probed ESSIDs') + 4, data.length),
				output = client.replace('\n','').replace(/ /g,'').replace(/,\r\n/g,'\r\n');
			console.log('update clients: \n'.help + output);
			io.sockets.emit('data', output);
		});
	});
}

airodump();