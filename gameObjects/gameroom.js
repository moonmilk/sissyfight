// GameRoom extends ChatRoom

var _ = require("lodash");
var util = require("util");
var ChatRoom = require("./chatroom");


function GameRoom(params) {
	ChatRoom.call(this, params);
	
	this.maxUsers = (params && typeof params.maxUsers === 'number') ? params.maxUsers : 6;
	
	this.password = undefined;
	this.blockedUsers = [];
	
	this.fighting = false;
	
}

util.inherits(GameRoom, ChatRoom);


// METHODS

// call with avatars=true to include avatar info in the occupants list
GameRoom.prototype.getInfo = function(avatars) {
	var info = GameRoom.super_.prototype.getInfo.call(this);
	
	// add game status to info
	if (this.fighting) info.status = 'fighting';
	else if (this.occupants.length >= this.maxUsers) info.status = 'full';
	else info.status = 'open';
	
	if (avatars) {
		info.occupants = this.getOccupantProperties(['id','nickname','avatar'], true);
	} // else use the default [id,nickname] from parent ChatRoom
	
	info.type = "GameRoom";
	
	return info;
}

// join override:
//   check for full or fighting; update full status
//	 callback: done(err, info about this room)
GameRoom.prototype.join = function(conn, done) {
	if (this.fighting) {
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
					// for the join message, include avatars of occupants with getInfo(true)
					this.emit('update', {update:'status', roomInfo:this.getInfo(true)});
				}
				if (done) done(null, roomInfo);
			}
			
			else {
				if (done) done(err);
			}
		}.bind(this));  // why do i need bind here to get the right This, when i never needed it before??
	}
}


// leave override:
//   update full status
//	 callback: done(err, info about this room)
GameRoom.prototype.leave = function(conn, done) {
	GameRoom.super_.prototype.leave.call(this, conn, function(err, roomInfo) {
		if (!err) {
			if (this.status!='fighting' && this.occupants.length < this.maxUsers) {
				this.status = 'open';
				this.emit('update', {update:'status', roomInfo:this.getInfo()});
			}
			if (done) done(null, roomInfo);
		}
		
		else {
			if (done) done(err);
		}
	}.bind(this)); // why do i need bind here too to get the right This, when i never needed it before??


}





module.exports = GameRoom;