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
	var testGames = ['hell room!', 'algebra 2', 'thunderdome', 'PLATE OF SHRIMP', 'Lothlorien', 'Preppies only!', 'ghostbusters', 'asdfgh', 'powder room', 'GOTH', 'mac & cheez', 'HYPNOTOAD', 'catfish?', 'Ow My Spleen', 'camembert', 'say NI', 'invisigoth', 'hey!', 'Windows 3.1', 'i <3 u', 'NO :[', 'Ascorbic', 'puppies', 'shAMpoO', 'Inconceivable!'];
	
	for (var i=0; i<testGames.length; i++) {
		this.createGame({name:testGames[i], school:this.id});
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



// callback: done(err, room object)
School.prototype.createGame = function(params, done) {
	params.id = this.nextGameID++;
	var game = new GameRoom(params);
	this.games[params.id] = game;
	
	game.on('update', this.gameUpdateListener.bind(this));
	game.start();
	
	if (done) done(null, game);
}

// callback: done(err)
School.prototype.destroyGame = function(done) {
	game.destroy();
	game.removeAllEventListeners();
	
	if (done) done(null);
}


// user request to create a game room 
// args: {name: 'room name'} -- custom game properties to come later
// callback: done(err, room object)
School.prototype.userCreateGameRoom = function(args, done) {
	// todo: sanity checking on name
	params = {};
	params.name = args.name || "no name";
	params.school = this.id;
	
	this.createGame(params, done);
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