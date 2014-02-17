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
		
		this.chatRecord = new createjs.DOMElement(document.getElementById('homeroomChat'));
		this.chatEntry = new createjs.DOMElement(document.getElementById('homeroomTextEntry'));
		this.chatBuffer = [];
		
		this.gameList = new createjs.Container();
		this.gameList.x = 148;
		this.gameList.y = 39;
		this.addChild(this.gameList);
		
		// make a mask to keep game listings inside the blackboard
		this.gameList.mask = new createjs.Shape();
		this.gameList.mask.graphics.beginFill('#fff').rect(0, 0, 340, 145).endFill();
		this.gameList.mask.x = 148;
		this.gameList.mask.y = 39;
		
		// create new game dialog box
		this.createGameDialog = this.addChild(new createjs.Container());
		this.createGameDialog.x = 148;
		this.createGameDialog.y = 39;
		this.createGameDialog.visible = false;
		this.createGameDialog.addChild(this.assets.bg_newgame);
		this.assets.bg_newgame.x = 32;
		this.assets.bg_newgame.y = 40;
		this.createGameDialog.buttons = {};
		this.createGameDialog.gameName = new createjs.DOMElement(document.getElementById('homeroomCreateGameEntry'));
		
		
		// attendance list button and popup
		this.attendanceLayer = this.addChild(new createjs.Container());
		this.attendanceLayer.list_closed = this.attendanceLayer.addChild(new createjs.Container());
		this.attendanceLayer.list_closed.addChild(this.assets.attendance_closed);
		this.attendanceLayer.list_closed.x = 353;
		this.attendanceLayer.list_closed.y = 229;
		this.attendanceLayer.list_closed.buttons = [];
		
		this.attendanceLayer.list_open = this.attendanceLayer.addChild(new createjs.Container());
		this.attendanceLayer.list_open.x = 353;
		this.attendanceLayer.list_open.y = 12;
		this.attendanceLayer.list_open.addChild(this.assets.attendance_open);
		this.attendanceLayer.textContainer = this.attendanceLayer.list_open.addChild(new createjs.Container());
		this.attendanceLayer.textContainer.x = 12;
		this.attendanceLayer.textContainer.y = 26;
		this.attendanceLayer.textContainer.mask = new createjs.Shape();
		this.attendanceLayer.textContainer.mask.graphics.beginFill('#fff').rect(12,26, 71,193);
		this.attendanceLayer.attendanceText = this.attendanceLayer.textContainer.addChild(new createjs.Text('', '10px Arial', '#444444'));
		this.attendanceLayer.attendanceText.lineHeight = 10;
		this.attendanceLayer.list_open.visible = false;
		this.attendanceLayer.list_open.buttons = [];

		this.attendanceLayer.attendanceCount = this.attendanceLayer.addChild(new createjs.Text('', '10px Arial', '#000000'));
		this.attendanceLayer.attendanceCount.x = 420;
		this.attendanceLayer.attendanceCount.y = 254;
		this.attendanceLayer.attendanceCount.lineWidth = 19;
		this.attendanceLayer.attendanceCount.textAlign = 'center';
		this.attendanceLayer.list_open.buttons = [];
		
		
				
		// display avatar without background layer, if any (like phone booth or bodyguard)
		this.avatar = this.addChild(new sf.Avatar());
		var nobg = {remove_background:true};
		_.defaults(nobg, look);
		this.avatar.setLook(nobg);
		this.avatar.x = 323;
		this.avatar.y = 162;
		
		
		_.each(games, function(game) {
			this.addGameListing(game);
		}, this);
		
		this.attendanceList = [];
		this.attendanceListOffset = 0;
		_.each(occupants, function(occupant) {
			this.addToAttendanceList(occupant);
		}, this);
		
		/*
		// put extra games in for testing scrolling
		for (var i=1;i<26; i++) {
			this.addGameListing({room:i+1000,roomName:"testRoom"+i,"occupants":[],"type":"GameRoom","status":"full"});
		}
		
		// put extra users in for testing scrolling
		for (var i=1000;i<1080; i++) {
			this.addToAttendanceList({id:i, nickname:'test'+i});
		};
		*/
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
		
		this.createGameDialog.gameName.setFakeScale(g.gameScale);
		this.createGameDialog.gameName.setPosition(293, 81);
		this.createGameDialog.gameName.setSize(83, 12);
		this.createGameDialog.gameName.setVisible(false);
		this.createGameDialog.gameName.htmlElement.value = "";
		
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
		
		// catch scroll events
		// http://stackoverflow.com/questions/10313142/javascript-capture-mouse-wheel-event-and-do-not-scroll-the-page
		this.getStage().canvas.onmousewheel = function(event) {
			this.handleScrollWheel(event.wheelDeltaY);
			event.preventDefault(); 
			return false;
		}.bind(this);
			
	}
	


	// clean up
	p.destroy = function() {
		_.forOwn(this.MESSAGES, function(type) {
			g.comm.removeEventListener(type, this["handle"+type+"Bound"]);
		}, this);
		this.chatEntry.setVisible(false);
		this.chatRecord.setVisible(false);
		this.chatEntry.htmlElement.onkeypress = null;
		this.createGameDialog.gameName.setVisible(false);
		this.createGameDialog.gameName.htmlElement.onkeypress = null;
		this.getStage().canvas.onmousewheel = null;
	}
	
	
	// mousewheel handler: scroll attendance list if it's visible and mouse is over it; else scroll game list
	p.handleScrollWheel = function(deltaY) {
		if (this.attendanceLayer.list_open.isVisible()) {
			var mouseX = this.getStage().mouseX;
			var mouseY = this.getStage().mouseY;
			var local = this.attendanceLayer.list_open.globalToLocal(mouseX, mouseY);
			if (this.attendanceLayer.list_open.hitTest(local.x, local.y)) {
				this.scrollAttendanceList(deltaY);
				return;
			}
		}
		
		this.scrollGameList(deltaY);
	}

	// message handlers -----
	
	// someone joined the room
	p.handlejoin = function(event) {
		//this.chatLog(event.data.nickname + " is here");
		this.addToAttendanceList(event.data);
	}
	
	// someone left the room
	p.handleleave = function(event) {
		//this.chatLog(event.data.nickname + " just left");
		this.removeFromAttendanceList(event.data);
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
	
	
	// update attendance list
	p.addToAttendanceList = function(who) {
		_.remove(this.attendanceList, {id:who.id}); // just to be sure nobody's in there twice
		this.attendanceList.unshift({id:who.id, nickname:who.nickname});
		this.updateAttendanceList();
	}
	
	p.removeFromAttendanceList = function(who) {
		_.remove(this.attendanceList, {id:who.id});
		this.updateAttendanceList();
	}
	
	p.updateAttendanceList = function() {
		this.attendanceLayer.attendanceText.text = _.pluck(this.attendanceList, 'nickname').join('\n');
		this.attendanceLayer.attendanceCount.text = this.attendanceList.length;
	}
	
	p.scrollAttendanceList = function(how) {
		// if all the players fit in one screen, always scroll to 0:
		if (this.attendanceList.length < 19) {
			this.attendanceListOffset = 0;
		}
		else {
			if (how=='up') {
				var destY = this.attendanceLayer.attendanceText.y + 120;
				if (destY > 0) destY = 0;
				var slide = createjs.Tween
					.get(this.attendanceLayer.attendanceText)
					.to({y:destY}, 100+2*Math.abs(this.attendanceLayer.attendanceText.y-destY), createjs.Ease.quadOut);
			}
		
			else if (how=='down') {
				var destY = this.attendanceLayer.attendanceText.y - 120;
				if (destY < (190 - this.attendanceList.length*10)) {
					destY = 190 - this.attendanceList.length*10;
				}
				var slide = createjs.Tween
					.get(this.attendanceLayer.attendanceText)
					.to({y:destY}, 100+2*Math.abs(this.attendanceLayer.attendanceText.y-destY), createjs.Ease.quadOut);
			}
			else {
				// deltaY from mouse wheel
				this.attendanceLayer.attendanceText.y += how;
			}
			if (this.attendanceLayer.attendanceText.y > 0) this.attendanceLayer.attendanceText.y = 0;
			if (this.attendanceLayer.attendanceText.y < (190 - this.attendanceList.length*10)) {
				this.attendanceLayer.attendanceText.y = 190 - this.attendanceList.length*10;
			}
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
			sf.Sound.buttonClick();
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
		sf.Sound.buttonClick();
		g.comm.writeEvent('dressingRoom');	
	}
	
	p.handlebtn_chat = function(event) {
		sf.Sound.buttonClick();
		this.sendChatText();
	}
	
	p.handlebtn_chalkboard_up = function(event) {
		sf.Sound.buttonClick();
		this.scrollGameList('up');
	}
	
	p.handlebtn_chalkboard_down = function(event) {
		sf.Sound.buttonClick();
		this.scrollGameList('down');
	}
	
	
	p.handlebtn_attendance_up = function(event) {
		sf.Sound.buttonClick();
		this.scrollAttendanceList('up');
	}
	p.handlebtn_attendance_down = function(event) {
		sf.Sound.buttonClick();
		this.scrollAttendanceList('down');
	}
	
	
	
	p.handlebtn_attendance_open = function(event) {
		sf.Sound.buttonClick();
		this.showAttendanceList(true);
	}
	p.handlebtn_attendance_close = function(event) {
		sf.Sound.buttonClick();
		this.showAttendanceList(false);
	}
	
	
	p.showAttendanceList = function(flag) {
		this.attendanceLayer.list_open.visible = flag;
	}



	p.handlebtn_creategame = function(event) {
		// show the create game dialog
		sf.Sound.buttonClick();
		this.gameList.visible = false;
		this.createGameDialog.visible = true;
		this.createGameDialog.gameName.setVisible(true);
		this.createGameDialog.gameName.htmlElement.value = "";
		this.createGameDialog.gameName.htmlElement.focus();
	}
	
	p.handlebtn_newgame_cancel = function(event) {
		sf.Sound.buttonClick();
		this.gameList.visible = true;
		this.createGameDialog.visible = false;
		this.createGameDialog.gameName.setVisible(false);
	}
	
	p.handlebtn_newgame_ok = function(event) {
		sf.Sound.buttonClick();
		this.gameList.visible = true;
		this.createGameDialog.visible = false;	
		this.createGameDialog.gameName.setVisible(false);
		
		var gameName = this.createGameDialog.gameName.htmlElement.value.trim();
		if (gameName.length > 0) {
			this.createGame(gameName);
			// todo: overlay to block ui events until server response
		}	
	}
	
	p.createGame = function(gameName) {
		g.comm.writeEvent("newgame", {name: gameName});
		// expected response: go to=gameroom
		// todo: display error responses - name taken, too many rooms
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
			btn_dressingroom:	[9, 189, this],
			btn_chat:			[88, 246, this],
			btn_chalkboard_up:	[440, 187, this],
			btn_chalkboard_down:[467, 188, this],
			
			btn_creategame:		[147, 188, this],
			
			btn_newgame_cancel:	[143, 70, this.createGameDialog],
			btn_newgame_ok:		[210, 70, this.createGameDialog],
			
			btn_attendance_open:[55, 2, this.attendanceLayer.list_closed],
			btn_attendance_close:[57, 2, this.attendanceLayer.list_open],
			
			btn_attendance_up:	[16, 220, this.attendanceLayer.list_open],
			btn_attendance_down:[47, 221, this.attendanceLayer.list_open]
			
		};
		_.forOwn(someButtons, function(what, who) {
		var b = what[2].addChild(this.assets[who].clone());
			what[2].buttons[who] = b
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
		// sort by y can move up listings that follow deleted listing
		_.each(_.sortBy(this.gameList.children, 'y'), function(gameListing) {
			// slide rooms below the deleted room up to fill space
			if (victim) {
				gameListing.y -= 25;
			}
			if (gameListing.gameID==id) {
				victim = gameListing;
				this.gameList.removeChild(victim);
				victim.destroy();
			}
		}, this);
		
		// scroll down if gamelist is now out of scroll window
		if (this.gameList.y < (config.homeroom.chalkboard.TALL_PX - this.getGameListHeight())) {
			this.gameList.y = 39; //config.homeroom.chalkboard.TALL_PX - this.getGameListHeight();
		}
		
	}
	
	p.updateGameListing = function(game) {
		var updated = _.find(this.gameList.children, {gameID:game.room});
		if (updated) {
			updated.update(game);
		}
	}
	
	
	// get total height of game listings, for scroll calculations
	p.getGameListHeight = function() {
		return this.gameList.children.length*25;
	}
	


	// scroll the list of games on chalkboard
	p.scrollGameList = function(how) {
		// if all the games fit in one screen, always scroll to 0:
		if (this.getGameListHeight() < config.homeroom.chalkboard.TALL_PX) {
			this.gameList.y = 39;
			return;
		}
		if (how=='up') {
			var destY = this.gameList.y + 120;
			if (destY > 39) destY = 39;
			var slide = createjs.Tween
				.get(this.gameList)
				.to({y:destY}, 100+2*Math.abs(this.gameList.y-destY), createjs.Ease.quadOut);
		}
	
		else if (how=='down') {
			var destY = this.gameList.y - 120;
			if (destY < (config.homeroom.chalkboard.TALL_PX - this.getGameListHeight())) {
				destY = config.homeroom.chalkboard.TALL_PX - this.getGameListHeight();
			}
			var slide = createjs.Tween
				.get(this.gameList)
				.to({y:destY}, 100+2*Math.abs(this.gameList.y-destY), createjs.Ease.quadOut);
		}
		else {
			// deltaY from mouse wheel
			this.gameList.y += how;
		}
		if (this.gameList.y > 39) this.gameList.y = 39;
		if (this.gameList.y < (config.homeroom.chalkboard.TALL_PX - this.getGameListHeight())) {
			this.gameList.y = config.homeroom.chalkboard.TALL_PX - this.getGameListHeight();
		}
	}



	
	
	
	
	// when someone clicks a join game button
	p.joingameHandler = function(event) {
		g.comm.writeEvent('joingame', {room:event.room});
	}
	
	
	
	
	
	
	
		
	sf.Homeroom = Homeroom;


})()