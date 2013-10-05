// GameRoom extends Container




// namespace:
this.sf = this.sf||{};

(function() {

var GameRoom = function(me, gameInfo) {
  this.initialize(me, gameInfo);
}

GameRoom.MAX_PLAYERS = 6;

var p = GameRoom.prototype = new createjs.Container();

	p.MESSAGES = ['join','leave','say', 'gameEvent'];  // list of socket messages I should listen for

	p.Container_initialize = p.initialize;
	
	p.initialize = function(me, gameInfo) {
		this.Container_initialize();
		
		this.prepareAssets();
		
		this.me = me; // id of this player, so I don't need any memory to know which one is me
		this.gameInfo = gameInfo; // game(id), gameName, occupants:[{id,nickname,avatar}]
		
		this.addChild(this.assets.gameroom_bg.clone());
		
		
		this.players = [];		// map position 0-5 -> player - don't iterate over this because it might have gaps
		this.playersByID = {};  // map id->player - iterate over this one for doing things to all players
		
		this.items = [];
		
		// console
		this.items.console = this.addChild(new sf.GameRoomConsole(this.assets, 0)); // TODO: colorize console to match uniform
		this.items.console.y = 222;
		
		
		// grab the 6 chat bubble divs from document for players to use as chat text
		this.textElements = [];
		for (var i=0; i<GameRoom.MAX_PLAYERS; i++) {
			this.textElements.push(document.getElementById('gameroomChatBubble'+i));
		}
		
		// grab div for chat entry
		this.chatEntry = new createjs.DOMElement(document.getElementById('gameroomTextEntry'));
		
		
		// permanent buttons
		this.items.btn_exitgame = this.addChild(this.assets.btn_exitgame.clone());
		this.items.btn_exitgame.x = 445;
		this.items.btn_exitgame.y = 3;
		this.items.btn_exitgame.helper = new createjs.ButtonHelper(this.items.btn_exitgame, "btn_exitgame", "btn_exitgame", "btn_exitgame_pressed");
		this.items.btn_exitgame.addEventListener("click", this.handleExitButton);
	}
	
	
	p.start = function() {
		// server will send occupants with me first, so don't need to worry about order (current player is always in position 0 on screen)
		_.each(this.gameInfo.occupants, function(playerInfo) {
			this.addPlayer(playerInfo);
		}, this);
		
		// set up message handlers
		_.forOwn(this.MESSAGES, function(type) {
			var handler = "handle" + type;
			var bound = this[handler].bind(this);
			this[handler+"Bound"] = bound;
			g.comm.addEventListener(type, bound);
		}, this);
		
		// set up chat entry field
		this.chatEntry.setFakeScale(g.gameScale);
		this.chatEntry.setPosition(6, 226);
		this.chatEntry.setSize(76, 41);
		this.chatEntry.setVisible(true);
			
		// catch enter in chat entry
		this.handlechatkeypressBound = this.handlechatkeypress.bind(this);
		this.chatEntry.htmlElement.onkeypress = this.handlechatkeypressBound;
		
		// start up console
		this.items.console.start();
		
		// watch for start button
		this.items.console.addEventListener('start', this.handleStartButton.bind(this));
	}
	
	
	p.destroy = function() {
		// remove message handlers
		_.forOwn(this.MESSAGES, function(type) {
			g.comm.removeEventListener(type, this["handle"+type+"Bound"]);
		}, this);
		// make sure players clean up their text elements when leaving gameroom
		_.each(this.playersByID, function(player) {
			this.removePlayer(player.playerInfo.id);
		}, this);
		if (this.textElements.length != GameRoom.MAX_PLAYERS) {
			// just in case, check for trouble that should never happen
			console.log("GameRoom: shutting down, should have " + GameRoom.MAX_PLAYERS + " free text elements but have " + this.textElements.length + " instead.");
		}
		this.chatEntry.htmlElement.onkeypress = null;
		this.chatEntry.setVisible(false);
		
		this.items.console.destroy();
	}
	
	
	// message handlers --------------
	
	
	p.handlejoin = function(event) {
		this.addPlayer(event.data);
	}
	
	p.handleleave = function(event) {
		this.removePlayer(event.data.id);
	}
	
	p.handlesay = function(event) {
		var player = this.playersByID[event.data.id];
		if (player) player.handlesay(event.data.text);
	}
	
	
	p.handlegameEvent = function(event) {
		switch(event.data.event) {
			case 'acted': // user chose an action or hit start button
				var actor = this.playersByID[event.data.id];
				if (actor) actor.setActed(true);
				else console.log("GameRoom: weirdly, i got an acted event for player not in this room, id " + event.data.event.id);
				break;
				
			case 'start':	// game is starting!
				this.items.console.setMode('game');
				_.each(this.playersByID, function(player){player.resetActed()});
				break;
			
			
			
			default:
				console.log('GameRoom: got unknown gameEvent ', event.data);
				break;
		}
	}
	
	
		
	// I said something
	p.say = function(text) {
		g.comm.writeEvent("say", {text: text});
	}
	
	
	// key handler
	p.handlechatkeypress = function(event) {
		event = event || window.event;

		if (event.keyCode == 13) {
			this.sendChatText();
			return false;
		}
		else {
			return true;
		}
	}
	p.sendChatText = function() {
		this.say(this.chatEntry.htmlElement.value);
		this.chatEntry.htmlElement.value = "";
	}


	// exit button clicked
	p.handleExitButton = function() {
		// request to return to homeroom
		g.comm.writeEvent("homeroom");
	}



	// start game button clicked
	p.handleStartButton = function() {
		g.comm.writeEvent("act", {action:"start"});
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
		this.playersByID[playerInfo.id] = player;
		
		// set its location
		player.x = 4 + 86*i + (i > 0) * 5;	// 5 pixels extra space after the first opsition
		player.y = 23;
		
		player.start();
		
		if (playerInfo.started) player.setActed(); // show to new entrant to room whether existing players have voted to start
	}
	
	
	p.removePlayer = function(playerID) {
		var player = this.playersByID[playerID];
		this.removeChild(player);
		delete this.playersByID[playerID];
		this.players[player.position] = undefined;
		
		// get the text element back from the player
		this.textElements.push(player.textElement);
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