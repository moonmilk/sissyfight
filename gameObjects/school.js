// School
// mostly just a collection of rooms - one homeroom and multipe gamerooms per school.


var Homeroom = require('./homeroom');
var GameRoom = require('./gameroom');
var SFGame = require('./sfgame');

var _ = require('lodash');

// globals
School.EMPTY_ROOM_PURGE_TIME = 30; // get rid of an empty room after 30 seconds
School.GAME_NAMES = _.shuffle(['hell room!', 'algebra 2', 'thunderdome', 'PLATE OF SHRIMP', 'Lothlorien', 'Preppies only!', 'ghostbusters', 'asdfgh', 'powder room', 'GOTH', 'mac & cheez', 'HYPNOTOAD', 'catfish?', 'Ow My Spleen', 'camembert', 'say NI', 'invisigoth', 'hey!', 'Windows 3.1', 'i <3 u', 'NO :[', 'Ascorbic', 'puppies', 'shAMpoO', 'Inconceivable!', 'grab this', 'ugli']);

function School(params) {
	this.id = params.id;
	this.name = params.name;
	
	this.homeroom = new Homeroom({id:0, name:'homeroom'});
	this.games = {};
	this.nextGameID = 1;
	
	// timer for periodic updates
	this.interval = setInterval(this.update.bind(this), 5000); 
	this.interval.unref(); // timer shouldn't prevent shutdown
	
	/*
	// for testing game listings
	var testGames = ['hell room!', 'algebra 2', 'thunderdome', 'PLATE OF SHRIMP', 'Lothlorien', 'Preppies only!', 'ghostbusters', 'asdfgh', 'powder room', 'GOTH', 'mac & cheez', 'HYPNOTOAD', 'catfish?', 'Ow My Spleen', 'camembert', 'say NI', 'invisigoth', 'hey!', 'Windows 3.1', 'i <3 u', 'NO :[', 'Ascorbic', 'puppies', 'shAMpoO', 'Inconceivable!'];
	
	for (var i=0; i<testGames.length; i++) {
		this.createGame({name:testGames[i], school:this.id});
	}
	*/
	
}

// get total population of school
School.prototype.getPopulation = function() {
	var pop = 0;
	if (this.homeroom) pop += this.homeroom.getPopulation();
	_.each(this.games, function(game) {
		pop += game.getPopulation();
	});
	return pop;
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



// callback: done(err, room object)
School.prototype.createGame = function(params, done) {
	params.id = this.nextGameID++;
	params.school = this.id;
	var game = new GameRoom(params);
	this.games[params.id] = game;
	
	game.on('update', this.gameUpdateListener.bind(this));
	game.start();
	
	if (done) done(null, game);
}

// callback: done(err)
School.prototype.destroyGame = function(game, done) {
	var gameID = game.id;
	game.destroy();
	game.removeAllListeners();
	delete this.games[gameID];
	
	if (done) done(null);
}


// user request to create a game room 
// args: {name: 'room name'} -- custom game properties to come later
// callback: done(err, room object)
School.prototype.userCreateGameRoom = function(args, done) {
	var params = SFGame.sanitizeNewGameParams(args);
	this.createGame(params, done);
}




// receive updates from games
School.prototype.gameUpdateListener = function(event) {
	//console.log("got a gameroom update: ", event);
	this.homeroom.handleGameUpdate(event);
}



// periodic maintenance: throw away old empty (normal) game rooms, but make sure there's always at least one empty room with normal rules.  
School.prototype.update = function() {
	// find rooms that have been empty for more than threshold time
	_.each(this.games, function(game) {
		if (game.getInfo().occupants.length > 0) {
			game._lastOccupiedTime = process.uptime(); // in seconds
			game._purgeable = false;
			game._emptyNormal = false;
		}
		else {
			if (game.getInfo().custom) game._emptyNormal = false;
			else game._emptyNormal = true;
			game._lastOccupiedTime = game._lastOccupiedTime || 0;
			if ((process.uptime() - game._lastOccupiedTime) > School.EMPTY_ROOM_PURGE_TIME) {
				game._purgeable = true;
			}
		}
	}, this);
	
	// console.log("school update: time=", process.uptime(), _.map(this.games, function(g) {return{name:g.name, occ:g._lastOccupiedTime, empty:g._empty, purge:g._purgeable}}));
	
	var empties = _.filter(this.games, '_emptyNormal');
	if (empties.length==0) {
		// no normal-rules empties - make a new room and move name to end of list
		var name = School.GAME_NAMES.shift();
		School.GAME_NAMES.push(name);
		
		this.createGame({name:name});
	}
	else {
		var purgeables = _.filter(this.games, '_purgeable');	
		if (purgeables.length > 1) {
			// more empties than necessary - get rid of one if any are old enough
			var purge = _.sample(purgeables);
			if (purge) this.destroyGame(purge);
		}
	}
}



module.exports = School;