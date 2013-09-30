// GameRoom extends ChatRoom

var _ = require("lodash");
var util = require("util");
var ChatRoom = require("./chatroom");


function GameRoom(params) {
	ChatRoom.call(this, params);
	
	this.schoolId = (params && params.schoolId) ? params.schoolId : 0;
	this.maxUsers = (params && params.maxUsers) ? params.maxUsers : 6;
	
	this.password = undefined;
	this.blockedUsers = [];
	
	this.status = "open"; // open, full, or fighting (future: maybe also locked?)
}

util.inherits(GameRoom, ChatRoom);


// METHODS

GameRoom.prototype.getInfo = function() {
	console.log("gameroom.getinfo...");
	var info = GameRoom.super_.prototype.getInfo.call(this);
	info.type = "GameRoom";
	info.status = this.status;
	return info;
}

// join override:
//   check for full or fighting; update full status
//	 callback: done(err, info about this room)
GameRoom.prototype.join = function(conn, done) {
	if (this.status=="fighting") {
		if (done) done({where:'gameroom', room:this.id, roomName:this.name, error:"fighting", message: "They're already fighting in there"});
	}
	else if (this.occupants.length >= this.maxUsers) {
		if (done) done({where:'gameroom', room:this.id, roomName:this.name, error:"full", message: "Game is full"});
	}
	// future: check for password?

	else {
		GameRoom.super_.prototype.join.call(this, conn, function(err, roomInfo) {
			if (!err) {
				console.log("homeroom joined by " + conn.user.nickname);
				if (roomInfo) roomInfo.type = "GameRoom";
							
				if (this.occupants.length == this.maxUsers) {
					this.status = 'full';
					this.emit('update', {update:'status', roomInfo:this.getInfo()});
				}
				done(null, roomInfo);
			}
			
			else {
				done(err);
			}
		});
	}
}


// leave override:
//   update full status
//	 callback: done(err, info about this room)
GameRoom.prototype.join = function(conn, done) {
	GameRoom.super_.prototype.leave.call(this, conn, function(err, roomInfo) {
		if (!err) {
			if (this.status!='fighting' && this.occupants.length < this.maxUsers) {
				this.status = 'open';
				this.emit('update', {update:'status', roomInfo:this.getInfo()});
			}
			done(null, roomInfo);
		}
		
		else {
			done(err);
		}
	});

}





module.exports = GameRoom;