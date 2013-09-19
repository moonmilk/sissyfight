// School
// mostly just a collection of rooms - one homeroom and multipe gamerooms per school.

var ChatRoom = require('./chatroom');

function School(params) {
	this.id = params.id;
	this.name = params.name;
	
	this.homeroom = new ChatRoom({id:0, name:'homeroom'});
	this.games = {};
}


// callback: done(err, homeroom)
School.prototype.getHomeroom = function(done) {
	if (done) done(null, this.homeroom);
}

// callback: done(err, gameroom)
School.prototype.getGameRoom = function(gameID) {
	var gameroom = this.games[gameID];
	if (!gameroom) {
		done({error:'nosuchgame', id:gameID});
	}
	else {
		done(null, game);
	}
} 


// periodic maintenance: throw away old empty game rooms, but make sure there's always at least one empty room.
School.prototype.update = function() {
	// TODO
}



module.exports = School;