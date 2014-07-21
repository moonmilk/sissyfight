// ChatRoom extends EventEmitter 
//   so that school can subscribe to status changes and broadcast them

var util = require("util");
var events = require("events");

var _ = require("lodash");


function ChatRoom(params) {
	events.EventEmitter.call(this);
	this.occupants = [];
	this.name = (params && params.name) ? params.name : "unnamed";
	this.id = (params && params.id) ? params.id : 0;
	this.school = (params && params.school) ? params.school : 0;
}

util.inherits(ChatRoom, events.EventEmitter);


ChatRoom.prototype.start = function() {
	this.emit('update', {update:'start', roomInfo:this.getInfo()});
}

ChatRoom.prototype.destroy = function() {
	// School should only purge empty rooms, but log error just in case
	if (this.occupants.length > 0) console.log("ChatRoom trouble: I got purged when I had occupants",this.getInfo());
	
	this.emit('update', {update:'destroy', roomInfo:this.getInfo()});
}



// METHODS

// initialize flood watch (call setupFloodWatch(false) to turn it off
ChatRoom.prototype.setupFloodWatch = function(interval, maximum, squelchTime) {
	if (!interval) {
		this.floodwatch = undefined;
		return;
	}
	this.floodwatch = {
		interval: 		interval,
		maximum:		maximum,
		squelchTime:	squelchTime,
		logs: {
			/*
				nickname: { // indexed by nickname rather than  so you can't get unsquelched by logging out and in again
					squelchTime: undefined or time squelch was applied
					record: [list of timestamps of chats that fall within the flood interval]
				}
			*/
		}
	};
} 

ChatRoom.prototype.getInfo = function() {
	return {room:this.id, roomName:this.name, occupants:this.getOccupantProperties(['id','nickname']), type:"ChatRoom"};
}

ChatRoom.prototype.getPopulation = function() {
	return this.occupants.length;
}


// callback: done(err, {room id, room name, occupants})
ChatRoom.prototype.join = function(conn, done) {
	if (!conn) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection is null");
		if (done) done({error:"nullconn", message:"connection is null"});
	}
	else if (this.occupants.indexOf(conn) != -1 || _.find(this.occupants, function(occupant){occupant.user.id==conn.user.id})) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to join but is already here"); 
		if (done) done({where:'chatroom', room:this.id, roomName:this.name, error:"duplicate", message: "You're already here!"});
	}
	else {
		this.occupants.push(conn);
		console.log("ChatRoom[" + this.id + "," + this.name + "]: added " + conn.user.nickname + " to room, occupants: ", this.getOccupantNicknames());
		conn.room = this;
		this.broadcastJoin(conn);
		this.emit('update', {update:'occupants', roomInfo:this.getInfo()});
		if (done) done(null, this.getInfo());
	}
}

// callback: done(err)
ChatRoom.prototype.leave = function(conn, done) {
	var index = this.occupants.indexOf(conn);
	if (index == -1) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to leave but is not here"); 
		if (done) done({where:'chatroom', room:this.id, roomName:this.name, error:"nothere", message: "Can't leave room you're not in"});
	}
	else {
		this.occupants.splice(index, 1);
		conn.room = null;
		this.broadcast("leave", {room:this.id, id:conn.user.id, nickname:conn.user.nickname});
		this.emit('update', {update:'occupants', roomInfo:this.getInfo()});
		if (done) done(null);
	}
}

// callback: done() (no error conditions)
ChatRoom.prototype.say = function(conn, text, done) {
	if (this.floodSquelchTest(conn.user.nickname)) {
		return;
	};
	
	// escape HTML and limit text length
	text = text.substring(0,140); // for now - 140 chars like a tweet
	text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;'); 
	console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " says " + text);
	this.broadcast("say", {id:conn.user.id, nickname:conn.user.nickname, text:text});
	if (done) done(null);
}


// when user sends a chat text, maintain floodwatch log and return true if current user's been talking too much
ChatRoom.prototype.floodSquelchTest = function(nickname) {
	if (!this.floodwatch) return false; // flood watch disabled
	
	// add this chat to the logs
	var now = Date.now();
	// create log for user if it doesn't already exist
	if (!this.floodwatch.logs[nickname]) {
		this.floodwatch.logs[nickname] = {
			squelchTime: undefined, 
			record: []
		};
	}
	this.floodwatch.logs[nickname].record.push(now);
	
	// trim old logs: throw away timestamps when they're too old to count against the squelch limit
	//   Go ahead and trim everyone's logs, not just the current chatting user - otherwise logs of users who stop talking never get cleaned up.
	//     (Don't want to clean up logs when someone leaves the room, because then they could escape squelch by leaving and re-entering)
	//	 Alternately, could have a timed interval for cleaning the logs, but i like to avoid those.
	var expire = now - this.floodwatch.interval;
	_.each(this.floodwatch.logs, function(log, nickname) {
		log.record = _.filter(log.record, function(timestamp) {return timestamp > expire}, this);
	}, this);
	

	// check squelch times and clean up any logs where user's not squelched and has no recent chat timestamps
	this.floodwatch.logs = _.pick(this.floodwatch.logs, function(log, nickname) {
		if (log.squelchTime < now) {
			log.squelchTime = undefined;
			console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + nickname + " was unsquelched.");
		}
		return (log.squelchTime || log.record.length > 0)
	}, this);
	
	
	// check if current user has talked too much and should be squelched
	//   if they are already squelched, continuing to try to flood will increase the penalty time
	//   but if they calm down, eventually it should expire
	if (this.floodwatch.logs[nickname].record.length > this.floodwatch.maximum) {
		this.floodwatch.logs[nickname].squelchTime = now + this.floodwatch.squelchTime;
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + nickname + " was squelched for talking too much.");
	}
	
	// testing: dump state of floodwatch
	//console.log("ChatRoom floodwatch", JSON.stringify(this.floodwatch, null, '\t'));
	
	// return true if squelched
	return (this.floodwatch.logs[nickname].squelchTime > 0);
}

// broadcast that conn has joined the room 
// -- separated out so GameRoom can override it
ChatRoom.prototype.broadcastJoin = function(conn) {
	this.broadcast("join", {room:this.id, id:conn.user.id, nickname:conn.user.nickname}, conn);
}


// if exclude is a connection, don't broadcast to that connection (e.g. so that clients don't receive their own join events)
// if data has any values that are functions, they will be applied to conn so that broadcast can be customized per connection
ChatRoom.prototype.broadcast = function(event, dataIn, exclude) {
	for (var i=0; i<this.occupants.length; i++) {
		var data = _.cloneDeep(dataIn);
		this.nestedApply(data, this.occupants[i]);
		if (!exclude || this.occupants[i] !== exclude) this.occupants[i].writeEvent(event, data);
	}
}

// recursively replace any function values with the result of applying the function to conn
ChatRoom.prototype.nestedApply = function(data,conn) {
	_.each(data, function(val, key) {
		if (typeof val==='function') data[key] = val.call(this, conn);
		else if (typeof val==='object') this.nestedApply(val, conn);
	}, this);
}

// return list of occupant user properties (default id and nickname)
ChatRoom.prototype.getOccupantProperties = function(props) {
	if (!props) props = ['id', 'nickname'];
	var occupants = [];
	for (var i=0; i<this.occupants.length; i++) {
		var occ = {};
		for (var j=0; j<props.length; j++) {
			occ[props[j]] = this.occupants[i].user[props[j]];
		}
		occupants.push(occ);
	}
	return occupants;
}


// return list of occupant nicknames
ChatRoom.prototype.getOccupantNicknames = function() {
	var names = [];
	for (var i=0; i<this.occupants.length; i++) {
		names.push(this.occupants[i].user.nickname);
	}
	return names;
}

// return occupant matching user id
ChatRoom.prototype.getOccupantByID = function(id) {
	return _.find(this.occupants, function(occupant){return occupant.user.id==id});
}



module.exports = ChatRoom;