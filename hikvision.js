// hikvision HTTP API Module

var net = require('net');
var events = require('events');
var util = require('util');
var request = require('request');
var	xml2js = require('xml2js');


// Define Globals
var	TRACE = false;
var	BASEURI = false;
var	parser = new xml2js.Parser();

// Module Loader
var hikvision = function(options) {

	if (options.log)
		TRACE = options.log;

	BASEURI = 'http://' + options.host + ':' + options.port
	this.activeEvents = { };
	this.triggerActive = false

	events.EventEmitter.call(this)
	this.client = this.connect(options, this)


};

util.inherits(hikvision, events.EventEmitter);

// Attach to camera
hikvision.prototype.connect = function(options, self) {
	var authHeader = 'Authorization: Basic ' + new Buffer(options.user + ':' + options.pass).toString('base64');

	// Connect
	var client = net.connect(options, () => {
		var header = 'GET /ISAPI/Event/notification/alertStream HTTP/1.1\r\n' +
		'Host: ' + options.host + ':' + options.port + '\r\n' +
		authHeader + '\r\n' +
		'Accept: multipart/x-mixed-replace\r\n\r\n';
		client.write(header)
		client.setKeepAlive(true, 1000)
		handleConnection(this, options);
	});

	client.on('data', (data) => {

		parser.parseString(data, function(err, result) {

			if (result) {
				var code = result['EventNotificationAlert']['eventType'][0]
				var action = result['EventNotificationAlert']['eventState'][0]
				var index = parseInt(result['EventNotificationAlert']['channelID'][0])
				var count = parseInt(result['EventNotificationAlert']['activePostCount'][0])

				// give codes returned by camera prettier and standardized description
				if (code === 'IO')            code = 'AlarmLocal';
				if (code === 'VMD')           code = 'VideoMotion';
				if (code === 'linedetection') code = 'LineDetection';
				if (code === 'videoloss')     code = 'VideoLoss';
				if (code === 'shelteralarm')  code = 'VideoBlind';
				if (action === 'active')    action = 'Start'
					if (action === 'inactive')  action = 'Stop'

				// create and event identifier for each recieved event
				// This allows multiple detection types with multiple indexes for DVR or multihead devices

				var eventIdentifier = code + index

				// Count 0 seems to indicate everything is fine and nothing is wrong, used as a heartbeat
				// if triggerActive is true, lets step through the activeEvents
				// If activeEvents has something, lets end those events and clear activeEvents and reset triggerActive

				if (count == 0) {
					if (self.triggerActive == true) {
						for(var i in self.activeEvents) {
							if(self.activeEvents.hasOwnProperty(i)){
								var eventDetails = self.activeEvents[i]
								if (TRACE)	console.log('Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"])/1000));
								self.emit("alarm", eventDetails["code"],'Stop', eventDetails["index"]);
							}
						}
						self.activeEvents	= {};
						self.triggerActive = false

					} else {
						// should be the most common result
						// Nothing interesting happening and we haven't seen any events
						if (TRACE)	self.emit("alarm", code,action,index);
					}
				}

				// if the first instance of an eventIdentifier, lets emit it,
				// add to activeEvents and set triggerActive
				else if (typeof self.activeEvents[eventIdentifier] == 'undefined' || self.activeEvents[eventIdentifier] == null){
					var eventDetails = { }
					eventDetails["code"] = code
					eventDetails["index"] = index
					eventDetails["lasttimestamp"] = Date.now();

					self.activeEvents[eventIdentifier] = eventDetails
					self.emit("alarm", code,action,index);
					self.triggerActive = true

				// known active events
			} else {
				if (TRACE)	console.log('    Skipped Event: ' + code + ' ' + action + ' ' + index + ' ' + count );

					// Update lasttimestamp
					var eventDetails = { }
					eventDetails["code"] = code
					eventDetails["index"] = index
					eventDetails["lasttimestamp"] = Date.now();
					self.activeEvents[eventIdentifier] = eventDetails

					// step through activeEvents
					// if we haven't seen it in more than 2 seconds, lets end it and remove from activeEvents
					for(var i in self.activeEvents) {
						if(self.activeEvents.hasOwnProperty(i)){
							var eventDetails = self.activeEvents[i]
							if (((Date.now() - eventDetails["lasttimestamp"])/1000) > 2) {
								if (TRACE)	console.log('    Ending Event: ' + i + ' - ' + eventDetails["code"] + ' - ' + ((Date.now() - eventDetails["lasttimestamp"])/1000));
								self.emit("alarm", eventDetails["code"],'Stop', eventDetails["index"]);
								delete self.activeEvents[i]
							}
						}
					}
				}
			}
		});
	});

	client.on('close', () => {// Try to reconnect after 30s
		setTimeout(()=>{
			this.connect(options);
		}, 30000);
		handleEnd(this);
	});

	client.on('error', (err) => {
		handleError(this, err);
	});
}

// Raw PTZ Command - command/arg1/arg2/arg3/arg4
hikvision.prototype.ptzCommand = (cmd) => {
	var args = arguments.slice(1, arguments.length);

	if ((!cmd) || arguments.some((arg) => isNaN(arg))) {
		handleError(this,'INVALID PTZ COMMAND')

		return 0;
	}

	request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=0&code=' + ptzcommand
		+ args.map((val, i) => '&arg' + (i + 1) + '=' + val)
		, function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			this.emit("error", 'FAILED TO ISSUE PTZ COMMAND');
		}
	})
}

// PTZ Preset - number
hikvision.prototype.ptzPreset = (preset) => {
	if (isNaN(preset))	handleError(this,'INVALID PTZ PRESET');
	request(BASEURI + '/cgi-bin/ptz.cgi?action=start&channel=0&code=GotoPreset&arg1=0&arg2=' + preset + '&arg3=0', function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			this.emit("error", 'FAILED TO ISSUE PTZ PRESET');
		}
	})
}

// PTZ Zoom - multiplier
hikvision.prototype.ptzZoom = (multiple) => {
	if (isNaN(multiple))
		handleError(this, 'INVALID PTZ ZOOM');

	if (multiple > 0)
		cmd = 'ZoomTele';
	if (multiple < 0)
		cmd = 'ZoomWide';
	if (multiple === 0)
		return 0;

	var data = {
		action: 'start',
		channel: 0,
		code: cmd,
		arg1: 0,
		arg2: multiple,
		arg3: 0,
	};

	request(BASEURI + '/cgi-bin/ptz.cgi?' + Object.keys(data).map(k=>k+'='+data[k]).join('&'), function (error, response, body) {
		if ((error) || (response.statusCode !== 200) || (body.trim() !== "OK")) {
			if (TRACE) 	console.log('FAILED TO ISSUE PTZ ZOOM');
			this.emit("error", 'FAILED TO ISSUE PTZ ZOOM');
		}
	})
}

// PTZ Move - direction/action/speed
hikvision.prototype.ptzMove = (direction,action,speed) => {
	if (isNaN(speed))	handleError(this,'INVALID PTZ SPEED');
	if (!['start', 'stop'].includes(action)) {
		handleError(this,'INVALID PTZ COMMAND')
		return 0;
	}
	if (!['Up', 'Down', 'Left', 'Right', 'LeftUp', 'RightUp', 'LeftDown', 'RightDown'].includes(direction)) {
		this.emit('error', 'INVALID PTZ DIRECTION: ' + direction)
		if (TRACE) 	console.log('INVALID PTZ DIRECTION: ' + direction);
		return 0;
	}

	var data = {
		action: action,
		channel: 0,
		code: direction,
		arg1: speed,
		arg2: speed,
		arg3: 0
	};

	request(BASEURI + '/cgi-bin/ptz.cgi?' + Object.keys(data).map(k=>k+'='+data[k]).join('&'), function (error, response, body) {
		if (error || response.statusCode !== 200 || body.trim() !== "OK") {
			this.emit("error", 'FAILED TO ISSUE PTZ UP COMMAND');
			if (TRACE) 	console.log('FAILED TO ISSUE PTZ UP COMMAND');
		}
	})
}

// Request PTZ Status
hikvision.prototype.ptzStatus = () => {
	request(BASEURI + '/cgi-bin/ptz.cgi?action=getStatus', function (error, response, body) {
		if ((!error) && (response.statusCode === 200)) {
			body = body.toString().split('\r\n').trim()
			if (TRACE) 	console.log('PTZ STATUS: ' + body);
			this.emit("ptzStatus", body);
		} else {
			this.emit("error", 'FAILED TO QUERY STATUS');
			if (TRACE) 	console.log('FAILED TO QUERY STATUS');

		}
	})
}

// Switch to Day Profile
hikvision.prototype.dayProfile = () => {
	request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInMode[0].Config[0]=1', function (error, response, body) {
		if ((!error) && (response.statusCode === 200)) {
			if (body === 'Error') {		// Didnt work, lets try another method for older cameras
				request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInOptions[0].NightOptions.SwitchMode=0', function (error, response, body) {
					if ((error) || (response.statusCode !== 200)) {
						this.emit("error", 'FAILED TO CHANGE TO DAY PROFILE');
						if (TRACE) 	console.log('FAILED TO CHANGE TO DAY PROFILE');
					}
				})
			}
		} else {
			this.emit("error", 'FAILED TO CHANGE TO DAY PROFILE');
			if (TRACE) 	console.log('FAILED TO CHANGE TO DAY PROFILE');
		}
	})
}

// Switch to Night Profile
hikvision.prototype.nightProfile = () => {
	request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInMode[0].Config[0]=2', function (error, response, body) {
		if ((!error) && (response.statusCode === 200)) {
			if (body === 'Error') {		// Didnt work, lets try another method for older cameras
				request(BASEURI + '/cgi-bin/configManager.cgi?action=setConfig&VideoInOptions[0].NightOptions.SwitchMode=3', function (error, response, body) {
					if ((error) || (response.statusCode !== 200)) {
						this.emit("error", 'FAILED TO CHANGE TO NIGHT PROFILE');
						if (TRACE) 	console.log('FAILED TO CHANGE TO NIGHT PROFILE');
					}
				})
			}
		} else {
			this.emit("error", 'FAILED TO CHANGE TO NIGHT PROFILE');
			if (TRACE) 	console.log('FAILED TO CHANGE TO NIGHT PROFILE');
		}
	})
}

// Handle connection
function handleConnection(self, options) {
	if (TRACE)	console.log('Connected to ' + options.host + ':' + options.port)
    	//self.socket = socket;
    self.emit("connect");
}

// Handle connection ended
function handleEnd(self) {
	if (TRACE)	console.log("Connection closed!");
	self.emit("end");
}

// Handle Errors
function handleError(self, err) {
	if (TRACE)	console.log("Connection error: " + err);
	self.emit("error", err);
}

// Prototype to see if string starts with string
String.prototype.startsWith = function (str){
	return this.slice(0, str.length) == str;
};

exports.hikvision = hikvision;
