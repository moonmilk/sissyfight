// SFGame - the actual game logic

var _ = require("lodash");
var util = require("util");




function SFGame(gameroom) {
	this.gameroom = gameroom;
	
	// let clients know game has started
	this.gameroom.broadcast('gameEvent', {event:'start'});
}


// user leaves game in progress
SFGame.prototype.leave = function(conn) {
	
}


// user plays a game action
//   in-game actions: cower, lolly, tattle, timeout, scratch, grab, tease
//		scratch, grab, and tease come with target:id of player being s/g/t 
SFGame.prototype.act = function(conn, data) {
	
}



module.exports = SFGame;