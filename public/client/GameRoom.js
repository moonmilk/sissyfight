// GameRoom extends Container




// namespace:
this.sf = this.sf||{};

(function() {

var GameRoom = function(me, gameInfo) {
  this.initialize(me, gameInfo);
}

GameRoom.MAX_PLAYERS = 6;

var p = GameRoom.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(me, gameInfo) {
		this.Container_initialize();
		
		this.prepareAssets();
		
		this.me = me; // id of this player, so I don't need any memory to know which one is me
		this.gameInfo = gameInfo; // game(id), gameName, occupants:[{id,nickname,avatar}]
		
		this.addChild(this.assets.gameroom_bg.clone());
		
		
		this.players = [];
		this.playersByID = {};  // map id->player
		
		// grab the 6 chat bubble divs from document for players to use as chat text
		this.textElements = [];
		for (var i=0; i<GameRoom.MAX_PLAYERS; i++) {
			this.textElements.push(document.getElementById('gameroomChatBubble'+i));
		}
		

	}
	
	
	p.start = function() {
		// server will send occupants with me first, so don't need to worry about order (current player is always in position 0 on screen)
		_.each(this.gameInfo.occupants, function(playerInfo) {
			this.addPlayer(playerInfo);
		}, this);
		
		// register message handlers
	}
	
	
	p.destroy = function() {
		// make sure players clean up their text elements when leaving gameroom
		_.each(this.players, function(player) {
			this.removePlayer(player.id);
		}), this;
		if (this.textElements.length != GameRoom.MAX_PLAYERS) {
			// just in case, check for trouble that should never happen
			console.log("GameRoom: shutting down, should have " + GameRoom.MAX_PLAYERS + " free text elements but have " + this.textElements.length + " instead.");
		}
	}
	
	
	
	p.addPlayer = function(playerInfo) {
		// find first empty slot
		for (var i=0; i<GameRoom.MAX_PLAYERS; i++) {
			if (!this.players[i]) break;
		}
		if (i >= GameRoom.MAX_PLAYERS) {
			console.log("GameRoom: tried to squeeze a " + GameRoom.MAX_PLAYERS + "th player into the room!"); // this should never happen!
			return;
		}
		// get a textElement for it
		var textElement = this.textElements.shift();
		if (!textElement) {
			console.log("GameRoom: ran out of textElements!"); // this should also never happen
		}
		// create player
		var player = this.addChild(new sf.GameRoomPlayer(i, playerInfo, textElement));
		this.players[i] = player;
		this.playersByID[player.id] = player;
		
		// set its location
		player.x = 4 + 86*i + (i > 0) * 5;	// 5 pixels extra space after the first opsition
		player.y = 23;
		
		player.start();
	}
	
	
	p.removePlayer = function(playerID) {
		var player = playersByID[playerID];
		delete playersByID[playerID];
		players[player.position] = undefined;
		
		// get the text element back from the player
		textElements.push(player.textElement);
		player.destroy();
	}
	
	
	
		

	p.prepareAssets = function() {
		this.assets = {};
		_.each(['gameroom_bgitems', 'gameroom_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
	sf.GameRoom = GameRoom;


})()