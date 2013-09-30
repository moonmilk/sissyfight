// School
// mostly just a collection of rooms - one homeroom and multipe gamerooms per school.

var ChatRoom = require('./chatroom');

function School(params) {
	this.id = params.id;
	this.name = params.name;
	
	this.homeroom = new ChatRoom({id:0, name:'homeroom'});
	this.games = {};
	
	// for testing game listings
	this.games[1] = {
		name: 'hell room!',
		id: 1,
		status: 'open',
		occupants: ['John', 'Paul', 'George', 'Ringo']
	};
	this.games[2] = {
		name: 'jam packed',
		id: 2,
		status: 'full',
		occupants: ['strawberry', 'marmalade', 'plum', 'grape', 'black cherry', 'blackberry']
	};	
	this.games[3] = {
		name: 'thunderdome',
		id: 3,
		status: 'fighting',
		occupants: ['The Rock', 'Killer Beethoven', 'Soup Nazi', 'Bub']
	};
	
	
}


// callback: done(err, homeroom)
School.prototype.getHomeroom = function(done) {
	if (done) done(null, this.homeroom);
}

// callback: done(err, gameroom)
School.prototype.getGameRoom = function(gameID, done) {
	var gameroom = this.games[gameID];
	if (!gameroom) {
		done({error:'nosuchgame', id:gameID});
	}
	else {
		done(null, gameroom);
	}
} 

// callback: done(err, gamerooms)
School.prototype.getGameRooms = function(done) {
	done(null, this.games);
}


// periodic maintenance: throw away old empty game rooms, but make sure there's always at least one empty room.
School.prototype.update = function() {
	// TODO
}



module.exports = School;