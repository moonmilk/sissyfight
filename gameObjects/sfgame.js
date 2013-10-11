// SFGame - the actual game logic

var _ = require("lodash");
var util = require("util");




function SFGame(gameroom) {
	this.gameroom = gameroom;
	
	this.players = {};	// map from player user ids to game status info
	
	this.state = "await actions";	// possible states: await actions, await eot, end of game
	
	this.turn_time = undefined;  // time at which current turn started
	
	this.prepareGame();
	this.startGame();
	this.broadcastStatus();
	this.startTurn();
}


// each user starts out with ...
SFGame.INITIAL_STATUS = {
	action: 	false,	// when player chooses an action, set this to e.g. {action:'grab', target:127}
	timeout:	false,		// set to true when player's timer has reached 0 (received timeout action)
	health:		10,
	lollies:	3,
	tattles:	2,
	cowardice:	0	// number of times cowered without being attacked
}

SFGame.TURN_TIME = 90;		// max time per turn, in seconds
SFGame.COUNTDOWN_TIME = 10;	// when all players have chosen an action, timer jumps to final countdown


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
	var actorInfo = this.players[conn.user.id];
	if (!actorInfo) {
		console.log('SFGame.act - connection user seems not to be in the game', conn.user);
		return;
	}
	
	// record the action - new actions replace old ones - except timeout, which is also recorded separately.
	if (data.action=='timeout') {
		actorInfo.timeout = true;
		if (!actorInfo.action) actorInfo.action = {action:'timeout'};
	}
	else {
		actorInfo.action = {action:data.action};
		if (data.target) {
			var targetInfo = this.players[data.target];
			if (!targetInfo) {
				console.log('SFGame.act - action target user seems not to be in the game', data);
				return;
			}
			actorInfo.action.target = data.target;
		}
	}
	// if everyone has reached timeout (can't find any player with timeout=false), turn is over!
	if (!_.find(this.players, {timeout:false})) {
		this.resolveTurn();
	}
	// otherwise, if everyone has acted (can't find any player with no action), go to final countdown 
	else if (!_.find(this.players, {action:false})) {
		this.gameEvent('countdown', {time:SFGame.COUNTDOWN_TIME});
	}

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
		//this.players[conn.user.id].lollies = conn.user.id % 4;
	}, this);
}


SFGame.prototype.startGame = function() {
	this.gameEvent('startGame');
}


SFGame.prototype.startTurn = function() {
	var game=this;
	// reset player per-turn info
	_.each(this.players, function(info, id) {
		info.action = false; 
		info.timeout = false
	}, this);
	
	this.gameEvent('startTurn', {
		time:SFGame.TURN_TIME, 
		lollies:function(conn){return game.players[conn.user.id].lollies}, 
		tattles:function(conn){return game.players[conn.user.id].tattles}
	});
}


SFGame.prototype.resolveTurn = function() {
	// TODO: actually resolve turn!
	// for testing: just start a new turn
	this.startTurn();
}




module.exports = SFGame;