// Game Room extends Chat Room

var util = require("util");
var ChatRoom = require("./chatroom");


function GameRoom(params) {
	ChatRoom.call(this, params);
	this.schoolId = (params && params.schoolId) ? params.schoolId : 0;
	this.maxUsers = (params && params.maxUsers) ? params.maxUsers : 6;
	
	this.password = undefined;
	this.blockedUsers = [];
	
	console.log("hello i am game room my name is " + this.name + " my id is " + this.id + " and maxUsers=" + this.maxUsers);
}

util.inherits(GameRoom, ChatRoom);

GameRoom.prototype.join = function(conn) {
	if (this.occupants.length >= this.maxUsers) {
		console.log("GameRoom[" + this.id + "," + this.name + "]: connection " + conn.user.nickname + " tried to join but room is full (" + this.maxUsers + " users)");
		conn.writeEvent("joined", {room:this.id, roomName:this.name, error:"full", message: "Room is full"});
		return false;
	}
	else {
		return GameRoom.super_.prototype.join.apply(this, arguments);
	}
}


module.exports = GameRoom;