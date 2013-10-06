// SFGame - the actual game logic

var _ = require("lodash");
var util = require("util");




function SFGame(gameroom) {
	this.gameroom = gameroom;
	
	this.players = {};	// map from player user ids to game status info
	
	// let clients know game has started
	this.gameEvent('start');
	this.prepareGame();
	this.broadcastStatus();
}


// each user starts out with ...
SFGame.INITIAL_STATUS = {
	health:		10,
	lollies:	3,
	tattles:	2,
	cowardice:	0	// number of times cowered without being attacked
}

// user leaves game in progress
SFGame.prototype.leave = function(conn) {
	
}

// utility: broadcast game event with type and args
SFGame.prototype.gameEvent = function(type, args) {
	this.gameroom.broadcast('gameEvent', _.assign({event:type}, args));
}


// user plays a game action
//   in-game actions: cower, lolly, tattle, timeout, scratch, grab, tease
//		scratch, grab, and tease come with target:id of player being s/g/t 
SFGame.prototype.act = function(conn, data) {
	
}


// status message has arg status:{[userid]:{health:[health]}...}
SFGame.prototype.broadcastStatus = function() {
	var statusEvent = {};
	_.each(this.players, function(info, id) {statusEvent[id] = {health:info.health}}, this);
	this.gameEvent('status', {status:statusEvent}); 
}



SFGame.prototype.prepareGame = function() {
	_.each(this.gameroom.occupants, function(conn) {
		this.players[conn.user.id] = _.clone(SFGame.INITIAL_STATUS);
	}, this);
}






module.exports = SFGame;