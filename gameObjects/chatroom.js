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

ChatRoom.prototype.join = function(conn) {
	if (this.occupants.indexOf(conn) != -1) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to join but is already here"); 
		conn.writeEvent("joined", {room:this.id, error:"duplicate", message: "You're already here!"});
		return false;
	}
	else {
		this.occupants.push(conn);
		console.log("ChatRoom[" + this.id + "," + this.name + "]: added " + conn.user.nickname + " to room, occupants: ", this.occupantNames());
		//this.emit("join", {user:conn, occupants:this.occupants});
		conn.writeEvent("joined", {room:this.id, roomName:this.name, error:false, occupants:this.occupantNames()});
		this.broadcast("join", {nickname:conn.user.nickname});
		return this;
	}
}

ChatRoom.prototype.leave = function(conn) {
	var index = this.occupants.indexOf(conn);
	if (index == -1) {
		console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to leave but is not here"); 
		return false;
	}
	else {
		//this.emit("leave", {user:conn, occupants:this.occupants});
		// broadcast before getting rid of conn, so conn also gets the leave confirmation
		this.broadcast("leave", {nickname:conn.user.nickname}); //, occupants:this.occupantNames()});
		this.occupants.splice(index, 1);
		return this;
	}
}

ChatRoom.prototype.say = function(conn, text) {
	console.log("ChatRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " says " + text);
	//this.emit("say", {user:conn, text:text});
	this.broadcast("say", {nickname:conn.user.nickname, text:text});
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