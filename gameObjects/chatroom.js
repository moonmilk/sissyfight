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
	this.emit('update', {update:'destroy', roomInfo:this.getInfo()});
}



// METHODS

ChatRoom.prototype.getInfo = function() {
	return {room:this.id, roomName:this.name, occupants:this.getOccupantProperties(['id','nickname']), type:"ChatRoom"};
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