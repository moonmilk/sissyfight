// ChatRoom //extends EventEmitter ????

//var util = require("util");
//var events = require("events");


function ChatRoom(params) {
	//events.EventEmitter.call(this);
	this.occupants = [];
	this.name = (params && params.name) ? params.name : "unnamed";
	this.id = (params && params.id) ? params.id : 0;
}

//util.inherits(ChatRoom, events.EventEmitter);


// METHODS

// callback: done(err, this room)
ChatRoom.prototype.join = function(conn, done) {
	if (this.occupants.indexOf(conn) != -1) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to join but is already here"); 
		var err = {room:this.id, error:"duplicate", message: "You're already here!"};
		if (conn) conn.writeEvent("joined", err);
		if (done) done(err);
	}
	else {
		this.occupants.push(conn);
		console.log("ChatRoom[" + this.id + "," + this.name + "]: added " + conn.user.nickname + " to room, occupants: ", this.occupantNames());
		//this.emit("join", {user:conn, occupants:this.occupants});
		if (conn) conn.writeEvent("joined", {room:this.id, roomName:this.name, error:false, occupants:this.occupantNames()});
		this.broadcast("join", {nickname:conn.user.nickname});
		if (done) done(null, this);
	}
}

// callback: done(err)
ChatRoom.prototype.leave = function(conn, done) {
	var index = this.occupants.indexOf(conn);
	if (index == -1) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to leave but is not here"); 
		var err = {room:this.id, error:"nothere", message: "Can't leave room you're not in"};
		if (conn) conn.writeEvent("left", err);
		if (done) done(err);
	}
	else {
		this.occupants.splice(index, 1);
		conn.writeEvent("left", {room:this.id, error:false});
		this.broadcast("leave", {nickname:conn.user.nickname});
		if (done) done(null);
	}
}

// callback: done() (no error conditions)
ChatRoom.prototype.say = function(conn, text, done) {
	console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " says " + text);
	//this.emit("say", {user:conn, text:text});
	this.broadcast("say", {nickname:conn.user.nickname, text:text});
	if (done) done(null);
}



ChatRoom.prototype.broadcast = function(event, data) {
	for (var i=0; i<this.occupants.length; i++) {
		this.occupants[i].writeEvent(event, data);
	}
}


ChatRoom.prototype.occupantNames = function() {
	var names = [];
	for (var i=0; i<this.occupants.length; i++) {
		names.push(this.occupants[i].user.nickname);
	}
	return names;
}



module.exports = ChatRoom;