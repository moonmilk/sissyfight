// School
// mostly just a collection of rooms - one homeroom and multipe gamerooms per school.


var Homeroom = require('./homeroom');
var GameRoom = require('./gameroom');

var _ = require('lodash');


function School(params) {
	this.id = params.id;
	this.name = params.name;
	
	this.homeroom = new Homeroom({id:0, name:'homeroom'});
	this.games = {};
	this.nextGameID = 1;
	
	// for testing game listings
	var testGames = [];
	testGames.push({
		name: 'hell room!', school:this.id
	});
	testGames.push({
		name: 'jam packed', school:this.id, maxUsers:0
	});	
	testGames.push({
		name: 'thunderdome', school:this.id
	});
	for (var i=0; i<testGames.length; i++) {
		this.createGame(testGames[i]);
	}
	
}


// callback: done(err, homeroom)
School.prototype.getHomeroom = function(done) {
	if (done) done(null, this.homeroom);
}

// callback: done(err, gameroom)
School.prototype.getGameRoom = function(gameID, done) {
	var gameroom = this.games[gameID];
	if (!gameroom) {
		if (done) done({error:'nosuchgame', id:gameID});
	}
	else {
		if (done) done(null, gameroom);
	}
} 

// callback: done(err, gamerooms)
School.prototype.getGameRooms = function(done) {
	if (done) done(null, this.games);
}

// callback: done(err, info for game rooms)
School.prototype.getGameRoomsInfo = function(done) {
	var gamesInfo = _.map(this.games, function(game) {return game.getInfo()});
	if (done) done(null, gamesInfo);
}



// callback: done(err, room info)
School.prototype.createGame = function(params, done) {
	params.id = this.nextGameID++;
	var game = new GameRoom(params);
	this.games[params.id] = game;
	
	game.on('update', this.gameUpdateListener.bind(this));
	game.start();
	
	if (done) done(null, game.getInfo());
}

// callback: done(err)
School.prototype.destroyGame = function(done) {
	game.destroy();
	game.removeAllEventListeners();
	
	if (done) done(null);
}


// receive updates from games
School.prototype.gameUpdateListener = function(event) {
	//console.log("got a gameroom update: ", event);
	this.homeroom.handleGameUpdate(event);
}



// periodic maintenance: throw away old empty game rooms, but make sure there's always at least one empty room.
School.prototype.update = function() {
	// TODO
}



module.exports = School;