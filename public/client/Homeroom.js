// Homeroom extends Container

// namespace:
this.sf = this.sf||{};

(function() {

var Homeroom = function(look, nickname, occupants, games) {
  this.initialize(look, nickname, occupants, games);
}

var p = Homeroom.prototype = new createjs.Container();

	p.MESSAGES = ['join','leave','say', 'gameUpdate'];  // list of socket messages I should listen for

	p.Container_initialize = p.initialize;
	
	p.initialize = function(look, nickname, occupants, games) {
		this.Container_initialize();	
		
		this.prepareAssets();
		
		this.addChild(this.assets.homeroom_bg.clone());
		
		// display avatar without background layer, if any (like phone booth or bodyguard)
		this.avatar = this.addChild(new sf.Avatar());
		var nobg = {remove_background:true};
		_.defaults(nobg, look);
		this.avatar.setLook(nobg);
		this.avatar.x = 323;
		this.avatar.y = 162;
		
		this.chatRecord = new createjs.DOMElement(document.getElementById('homeroomChat'));
		this.chatEntry = new createjs.DOMElement(document.getElementById('homeroomTextEntry'));
		this.chatBuffer = [];
		
		this.gameList = new createjs.Container();
		this.gameList.x = 148;
		this.gameList.y = 39;
		this.addChild(this.gameList);
		
		_.forOwn(games, function(game) {
			this.addGameListing(game);
		}, this);
	}
	
	
	p.start = function() {
		/*
		this.chatEntry.htmlElement.style.position = 'absolute';
		this.chatEntry.htmlElement.style.left = "7px";
		this.chatEntry.htmlElement.style.top = "228px";
		this.chatEntry.htmlElement.style.width = "79px";
		this.chatEntry.htmlElement.style.height = "43px";
		*/
		this.chatEntry.setFakeScale(g.gameScale);
		this.chatEntry.setPosition(6, 227);
		this.chatEntry.setSize(76, 42);
		this.chatEntry.setVisible(true);
		
		this.chatRecord.setFakeScale(g.gameScale);
		this.chatRecord.setPosition(12,33);
		this.chatRecord.setSize(120, 150);
		this.chatRecord.setVisible(true);
		
		this.chatRecord.htmlElement.innerHTML = "";
		
		// set up message handlers
		_.forOwn(this.MESSAGES, function(type) {
			var handler = "handle" + type;
			var bound = this[handler].bind(this);
			this[handler+"Bound"] = bound;
			g.comm.addEventListener(type, bound);
		}, this);
		
		// set up buttons
		this.prepareButtons();
	
		// catch enter in chat entry
		this.handlechatkeypressBound = this.handlechatkeypress.bind(this);
		this.chatEntry.htmlElement.onkeypress = this.handlechatkeypressBound;
	}
	


	// clean up
	p.destroy = function() {
		_.forOwn(this.MESSAGES, function(type) {
			g.comm.removeEventListener(type, this["handle"+type+"Bound"]);
		}, this);
		this.chatEntry.setVisible(false);
		this.chatRecord.setVisible(false);
		this.chatEntry.htmlElement.onkeypress = null;
	}
	
	

	// message handlers -----
	
	// someone joined the room
	p.handlejoin = function(event) {
		this.chatLog(event.data.nickname + " is here");
	}
	
	// someone left the room
	p.handleleave = function(event) {
		this.chatLog(event.data.nickname + " just left");
	}
	
	// someone said something
	p.handlesay = function(event) {
		this.chatLog("<b>" + event.data.nickname + "</b>: " + event.data.text);
	}
	
	
	// update the chalkboard of games
	p.handlegameUpdate = function(event) {
		switch(event.data.update) {
			case 'start': // new game room
				this.addGameListing(event.data.roomInfo);
				break;
			case 'destroy': // delete game room
				this.removeGameListing(event.data.roomInfo.room);
				break;
			case 'occupants':
			case 'status': // update game room
				this.updateGameListing(event.data.roomInfo);
				break;
			
			default:
				console.log("Homeroom: unknown gameUpdate type " + event.data.update);
				break;
		}
	}
	
	
	
	// local interactions
	
	
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

	// button handlers
	p.handlebtn_dressingroom = function(event) {
		// request server to send client back to dressing room
		g.comm.writeEvent('dressingRoom');	
	}
	
	p.handlebtn_chat = function(event) {
		this.sendChatText();
	}


	// update chat box
	p.chatLog = function(text) {
		this.chatBuffer.push(text);
		while(this.chatBuffer.length > 24) this.chatBuffer.shift();
		this.chatRecord.htmlElement.innerHTML = this.chatBuffer.join('<br/>');
		this.chatRecord.htmlElement.scrollTop = this.chatRecord.htmlElement.scrollHeight;
	}



	p.prepareButtons = function() {
		this.buttons = {};
		var someButtons = {
			btn_dressingroom:	[9, 189],
			btn_chat:			[88, 246]
		};
		_.forOwn(someButtons, function(what, who) {
		var b = this.addChild(this.assets[who].clone());
			this.buttons[who] = b
			b.x = what[0];
			b.y = what[1];
			b.helper = new createjs.ButtonHelper(b, who, who, who+"_pressed");
			var bound = this['handle'+who].bind(this);
			this['handle'+who+"Bound"] = bound;
			b.addEventListener('click', bound);
		}, this);
	}
	

	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_bg', 'homeroom_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
	
	
	// update game listings
	p.addGameListing = function(game) {
		var listing = new sf.HomeroomGameListing(game);
		listing.y = this.gameList.children.length*25;
		this.gameList.addChild(listing);
		listing.start();
		listing.addEventListener('joingame', this.joingameHandler.bind(this));
	}
	
	p.removeGameListing = function(id) {
		var victim;
		for (var i=0; i<this.gameList.children.length; i++) {
			var gameListing = this.gameList.children[i];
			// slide rooms below the deleted room up to fill space
			if (victim) {
				gameListing.y -= 25;
			}
			if (gameListing.gameID==id) {
				victim = gameListing;
				this.gameList.removeChild(victim);
				victim.destroy();
			}
		}
	}
	
	p.updateGameListing = function(game) {
		var updated = _.find(this.gameList.children, {gameID:game.room});
		if (updated) {
			updated.update(game);
		}
	}
	
	
	
	// when someone clicks a join game button
	p.joingameHandler = function(event) {
		g.comm.writeEvent('joingame', {room:event.room});
	}
	
	
	
	
	
	
	
		
	sf.Homeroom = Homeroom;


})()