// GameRoom extends ChatRoom

var _ = require("lodash");
var util = require("util");
var ChatRoom = require("./chatroom");
var SFGame = require("./sfgame");


function GameRoom(params) {
	ChatRoom.call(this, params);
	
	this.maxUsers = (params && typeof params.maxUsers === 'number') ? params.maxUsers : GameRoom.MAX_PLAYERS;
	
	// room access
	this.password = undefined; 	// not used yet
	this.blockedUsers = []; 	// also not yet
	
	// voting to start a game (everyone in room must have clicked Start; need at least 3 players to start)
	this.startVotes = {};
	
	
	this.game = undefined;  // when game is in progress, this is a SFGame object
	
}

util.inherits(GameRoom, ChatRoom);


// CONSTANTS
GameRoom.MAX_PLAYERS = 6;
GameRoom.MIN_PLAYERS = 3;

// METHODS

// call with avatars=true to include avatar info in the occupants list
GameRoom.prototype.getInfo = function(avatars) {
	var info = GameRoom.super_.prototype.getInfo.call(this);
	
	// add game status to info
	if (this.game) info.status = 'fighting';
	else if (this.occupants.length >= this.maxUsers) info.status = 'full';
	else info.status = 'open';
	
	if (avatars) {
		// add startVotes to info so latecomers to game can see who has already pressed start
		info.occupants = _.map(this.occupants, function(conn){
			return {
				started:	this.startVotes[conn],
				id:			conn.user.id,
				nickname:	conn.user.nickname,
				avatar:		conn.user.avatar
			}
		}, this);
	} // else use the default [id,nickname] from parent ChatRoom
	
	info.type = "GameRoom";
	
	return info;
}

// join override:
//   check for full or fighting; update full status
//	 callback: done(err, info about this room)
GameRoom.prototype.join = function(conn, done) {
	if (this.game) {
		if (done) done({where:'gameroom', room:this.id, roomName:this.name, error:"fighting", message: "They're already fighting in there"});
	}
	else if (this.occupants.length >= this.maxUsers) {
		if (done) done({where:'gameroom', room:this.id, roomName:this.name, error:"full", message: "Game is full"});
	}
	// future: check for password?

	else {
		GameRoom.super_.prototype.join.call(this, conn, function(err, roomInfo) {
			if (!err) {
				console.log("gameroom joined by " + conn.user.nickname);
							
				if (this.occupants.length == this.maxUsers) {
					this.emit('update', {update:'status', roomInfo:roomInfo});
				}
				// for the join message, include avatars of occupants with getInfo(true)
				roomInfo = this.getInfo(true);
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
			// clear start vote
			delete this.startVotes[conn];
			
			// let the game know, if any
			if (this.game) this.game.leave(conn);
			
			// update status
			if (!this.game && this.occupants.length < this.maxUsers) {
				this.emit('update', {update:'status', roomInfo:this.getInfo()});
			}
			if (done) done(null, roomInfo);
		}
		
		else {
			if (done) done(err);
		}
	}.bind(this)); // why do i need bind here too to get the right This, when i never needed it before??


}


// broadcastJoin override: include avatar in the join message 
GameRoom.prototype.broadcastJoin = function(conn) {
	this.broadcast("join", {room:this.id, id:conn.user.id, nickname:conn.user.nickname, avatar:conn.user.avatar}, conn);
}



// handle game actions from client (events of type 'act')
GameRoom.prototype.act = function(conn, data) {
	console.log("GameRoom: got action", data, "from", conn.user.nickname);
	
	// let everyone know the user chose an action, except timeout which doesn't count!
	if (data.action != 'timeout') this.broadcast("gameEvent", {event:'acted', id:conn.user.id});

	// if there's a game running, let it handle the action
	if (this.game) this.game.act(conn, data);
	
	else {
		if (data.action=='start') {
			this.startVotes[conn] = true;
			var votes = _.size(this.startVotes);
			if (votes >= GameRoom.MIN_PLAYERS && votes==this.occupants.length) {
				// start the game!
				this.startGame();
			}
		}
	}
}




// start a new game
GameRoom.prototype.startGame = function() {
	console.log("GameRoom: starting game with occupants " + this.getOccupantNicknames().join(", "));
	this.game = new SFGame(this);

	this.emit('update', {update:'status', roomInfo:this.getInfo()});
}




module.exports = GameRoom;