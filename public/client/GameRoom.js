// GameRoom extends Container




// namespace:
this.sf = this.sf||{};

(function() {

var GameRoom = function(me, gameInfo) {
  this.initialize(me, gameInfo);
}

GameRoom.MAX_PLAYERS = 6;

GameRoom.PING_INTERVAL = 5000; // send ping to server every 5 seconds

var p = GameRoom.prototype = new createjs.Container();

	p.MESSAGES = ['join','leave','say', 'gameEvent'];  // list of socket messages I should listen for

	p.Container_initialize = p.initialize;
	
	p.initialize = function(me, gameInfo) {
		this.Container_initialize();
		
		g.testGameRoom = this;
		
		this.prepareAssets();
		
		this.me = me; // id of this player, so I don't need any memory to know which one is me
		this.gameInfo = gameInfo; // game(id), roomName, occupants:[{id,nickname,avatar}]
		
		this.state = 'pregame'; // can be pregame or game
		
		this.addChild(this.assets.gameroom_bg.clone());
		
		
		this.players = [];		// map position 0-5 -> player - don't iterate over this because it might have gaps
		this.playersByID = {};  // map id->player - iterate over this one for doing things to all players
		this.looksByID = {};	// map id->avatar look, so can get looks even of players who have left the room
		
		this.items = [];
		this.layers = [];
		
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
		
		// layer for players
		this.layers.playerLayer = this.addChild(new createjs.Container());
		
		// layer for end of game results chalkboard
		this.layers.chalkboardLayer = this.addChild(new createjs.Container());
		this.layers.chalkboardLayer.x = -300;
		this.items.chalkboard = this.assets.chalkboard;
		this.items.chalkboard.x = 0;
		this.items.chalkboard.y = 91;
		this.layers.chalkboardLayer.addChild(this.items.chalkboard);
		this.items.chalkboardText = new createjs.Text('', config.getFont('gameResultsChalkboard'), '#ffffff');
		this.items.chalkboardText.lineWidth = 276;
		this.items.chalkboardText.x = 10;
		this.items.chalkboardText.y = 113;
		this.layers.chalkboardLayer.addChild(this.items.chalkboardText);
		
		
		// permanent buttons
		this.prepareButtons();
		
				
		// put the name of the game up
		//console.log(this.gameInfo);
		var gameName = new createjs.Text(this.gameInfo.roomName, config.getFont('gameRoomGameName'), '#eeeeee');
		gameName.x = 192;
		gameName.y = 6;
		this.addChild(gameName);
		
		
		// action status tag displays which game action you've chosen
		this.items.actionStatusTag = this.addChild(this.assets.act_status_grab.clone());
		this.items.actionStatusTag.y = 210;
		this.items.actionStatusTag.visible = false;
		
		// layer for action menus
		this.layers.actionMenuLayer = this.addChild(new createjs.Container());
		
		// layer for results pictures 
		this.layers.resultsLayer = this.addChild(new createjs.Container());
		
		// layer for dust cloud
		this.layers.dustCloudLayer = this.addChild(new createjs.Container());
		
		
		// prepare timer
		this.timerTime = 0;  // seconds on timer;
		this.timerNextTick = undefined;   // time in msec for next countdown, or falsey if timer's not running	

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
		//this.chatEntry.setSize(76, 41);
		this.chatEntry.setVisible(true);
			
		// catch enter in chat entry
		this.handlechatkeypressBound = this.handlechatkeypress.bind(this);
		this.chatEntry.htmlElement.onkeypress = this.handlechatkeypressBound;
		
		// start up console
		this.items.console.start();
		
		// watch for start button
		this.items.console.addEventListener('start', this.handleStartButton.bind(this));
		
		// watch for show results button
		this.items.console.addEventListener('showResults', this.handleShowResultsButton.bind(this));
		
		// get ticks for updating timer
		this.handleTickBound = this.handleTick.bind(this);
		createjs.Ticker.addEventListener('tick', this.handleTickBound);
		
		this.sounds = {};
		// start the playground audio loop
		this.sounds.playloop = sf.Sound.play('snd_playloop', true);
		this.sounds.playloop.setVolume(0.5);
		
		// make mute button reflect actual mute state
		this.setMuteButton();
		
		// default chat mode: not loud
		this.chatLoud = false;
		
		// ping timer
		this.nextPingTime = 0; // ping immediately
				
		// for testing results displays from the console
		window.r = this.handleTurnResults.bind(this);
		window.i = {looks:this.looksByID, players:this.playersByID};
	}
	
	
	p.destroy = function() {
		// stop all long sounds
		_.each(this.sounds, function(soundInstance) {
			soundInstance.stop();	
		}, this);
		
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
		
		createjs.Ticker.removeEventListener('tick', this.handleTickBound);
		
		this.items.console.removeAllEventListeners();
		this.items.console.destroy();
		
		this.displayResultsDone('destroy');
		
		createjs.Tween.removeTweens(this.layers.chalkboardLayer);
		
		window.r = null;
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
				
			case 'startGame':	// game is starting!
				if (this.sounds.music) this.sounds.music.stop();
				this.sounds.music = sf.Sound.play('music_intro');
				this.removeActionMenu();
				this.displayResultsDone();
				this.items.console.disableShowResults();
				this.state = 'game';
				this.items.console.setMode('game');
				_.each(this.playersByID, function(player) {
					player.setPose('normal');
				})
				break;
				
			case 'startTurn':
				delete this.sounds.countdown; // reset countdown sound so it can play again this turn
				this.removeActionMenu();
				this.setTimer(event.data.time);
				_.each(this.playersByID, function(player){player.resetActed()}, this);
				this.lollyCounter = event.data.lollies;
				this.tattleCounter = event.data.tattles;
				this.items.console.setLolliesAndTattles(event.data.lollies, event.data.tattles);
				this.setPlayerActionTag(); // clear all action tags
				break;
			
			case 'status':	// health of each player (maybe other things in future? but probably just health)
				_.each(event.data.status, function(playerStatus, playerID) {
					var player = this.playersByID[playerID]; 
					if (player) {
						player.setStatus(playerStatus);
						if (playerStatus.health===0) {
							player.setPose('crying');
						}
					}
					else console.log("GameRoom.handlegameEvent: got status for player who isn't here, userid=",playerID);
				}, this);
				break;
				
			case 'countdown': // every player has moved; final countdown gives everyone [10] seconds to change their minds
				// play countdown sound unless it's already played this turn
				if (!this.sounds.countdown) {
					this.sounds.countdown = sf.Sound.play('snd_countdown');
				}
				if (this.getTimer() > event.data.time) this.setTimer(event.data.time);
				break;	
				
			case 'endTurn':
				sf.Sound.play('snd_buzzer');
				this.setPlayerActionTag();
				this.handleTurnResults(event.data.results);
				
				break;
				
			case 'endGame':
				this.items.console.disableShowResults();
				this.removeActionMenu();
				this.state = 'pregame';
				this.items.console.setMode('pregame');
				_.each(this.playersByID, function(player) {
					player.resetActed();
				});
				// give winners victory pose
				// TODO
				// display endgame scoreboard
				// TODO
				break;
			
			
			default:
				console.log('GameRoom: got unknown gameEvent ', event.data);
				break;
		}
	}
	
	
	
	p.handleTurnResults = function(results) {
		// check if results include an end of game scene - that needs special handling
		var endScenes = _.where(results, {scene:'end'});
		var nonEndScenes = _.reject(results, {scene:'end'});
		
		if (endScenes.length > 0) {
			this.handleEndScene(endScenes[0]); // assumption: there's never more than one end scene!
		}
				
		this.lastTurnResults = nonEndScenes;
		if (this.lastTurnResults.length > 0) {
			this.displayResults(this.lastTurnResults);
			this.items.console.enableShowResults();
			if (endScenes.length==0) {			
				// not end of game, play the polaroid loop
				if (this.sounds.music) this.sounds.music.stop();
				if (this.sounds.polaroidloop) {
					this.sounds.polaroidloop.stop();
				}
				this.sounds.polaroidloop = sf.Sound.play('music_polaroid', true);
			}
		}
	}
		

	// sample data for testing: 
	// r([{scene:'end', code:{winners:[1]}, text:'Porgy and Bess won the game and became best friends forever.\n\nThey each earned 50 points.\n\nEveryone else earned 10 points for playing.', damage:{}}]);		
	p.handleEndScene = function(scene) {
		var iwon = false;
		// victory poses for winners, if any 
		// (losers will have already had their lose poses set by the health status report)
		_.forEach(scene.code.winners, function(winnerID) {
			var playerAvatar = this.playersByID[winnerID];
			playerAvatar.setPose('victory');
			if (winnerID==this.me) iwon = true;
		}, this);
		
		if (this.sounds.music) this.sounds.music.stop();
		if (iwon) {
			sf.Sound.play('music_winner');
		}
		else {
			sf.Sound.play('music_loser');
		}
		
		// display the caption on the rolling chalkboard
		this.items.chalkboardText.text = scene.text;
		this.layers.chalkboardLayer.x = 500;
		this.items.chalkboardTween = createjs.Tween.get(this.layers.chalkboardLayer).to({x:-300}, 15000);
	}		

	
	// time is passing!
	p.handleTick = function() {
		this.updateTimer();
		var now = createjs.Ticker.getTime();
		if (now > this.nextPingTime) {
			this.nextPingTime = now + GameRoom.PING_INTERVAL;
			g.comm.writeEvent("ping");
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
			sf.Sound.keyClick();
			this.sendChatText();
			return false;
		}
		else {
			return true;
		}
	}
	p.sendChatText = function() {
		var text = this.chatEntry.htmlElement.value;
		if (this.chatLoud && text.charAt(0) != "!") text = "!" + text; // ! at start of line signals loud
		this.say(text);
		this.chatEntry.htmlElement.value = "";
	}


	// send chat text when button's pressed
	p.handlebtn_chat = function() {
		sf.Sound.buttonClick();
		this.sendChatText();
	}
	
	// toggle loud mode and switch the button assets to match
	p.handlebtn_chatmode_loud = function() {
		sf.Sound.buttonClick();
		this.chatLoud = !this.chatLoud;
		
		if (this.chatLoud) {
			this.buttons.btn_chat.helper.downLabel = 'btn_chat_loud_pressed';
			this.buttons.btn_chat.helper.outLabel = 'btn_chat_loud';
			this.buttons.btn_chat.helper.overLabel = 'btn_chat_loud';
			this.buttons.btn_chat.gotoAndStop('btn_chat_loud');
			
			this.buttons.btn_chatmode_loud.helper.downLabel = 'btn_chatmode_normal_pressed';
			this.buttons.btn_chatmode_loud.helper.outLabel = 'btn_chatmode_normal';
			this.buttons.btn_chatmode_loud.helper.overLabel = 'btn_chatmode_normal';
			this.buttons.btn_chatmode_loud.gotoAndStop('btn_chatmode_normal');
			
			this.chatEntry.htmlElement.className = this.chatEntry.htmlElement.className.replace( /gameroomChatNormal/g , 'gameroomChatBig' );
		}
		else {
			this.buttons.btn_chat.helper.downLabel = 'btn_chat_pressed';
			this.buttons.btn_chat.helper.outLabel = 'btn_chat';
			this.buttons.btn_chat.helper.overLabel = 'btn_chat';
			this.buttons.btn_chat.gotoAndStop('btn_chat');
			
			this.buttons.btn_chatmode_loud.helper.downLabel = 'btn_chatmode_loud_pressed';
			this.buttons.btn_chatmode_loud.helper.outLabel = 'btn_chatmode_loud';
			this.buttons.btn_chatmode_loud.helper.overLabel = 'btn_chatmode_loud';
			this.buttons.btn_chatmode_loud.gotoAndStop('btn_chatmode_loud');		
			
			this.chatEntry.htmlElement.className = this.chatEntry.htmlElement.className.replace( /gameroomChatBig/g , 'gameroomChatNormal' );	
		}
		
	}


	// exit button clicked
	p.handlebtn_exitgame = function() {
		// request to return to homeroom
		sf.Sound.buttonClick();
		g.comm.writeEvent("homeroom");
	}
	
	
	
	


	p.handlebtn_mute = function(event) {
		if (sf.Sound.getMute()) {
			sf.Sound.setMute(false);
		}
		else {
			sf.Sound.setMute(true);
		}
		// attempt to play click sound even if muted
		// because (in osx chrome at least) the first sound after a mute seems to play at least the first few samples
		// so this will use up that bit of sound, and is harmless if mute really works
		sf.Sound.buttonClick();
		this.setMuteButton();
	}
	p.setMuteButton = function() {
		if (sf.Sound.getMute()) {
			this.buttons.btn_mute.helper.downLabel = 'btn_mute_on_pressed';
			this.buttons.btn_mute.helper.outLabel = 'btn_mute_on';
			this.buttons.btn_mute.helper.overLabel = 'btn_mute_on';
			this.buttons.btn_mute.gotoAndStop('btn_mute_on');
		}
		else {
			this.buttons.btn_mute.helper.downLabel = 'btn_mute_pressed';
			this.buttons.btn_mute.helper.outLabel = 'btn_mute';
			this.buttons.btn_mute.helper.overLabel = 'btn_mute';
			this.buttons.btn_mute.gotoAndStop('btn_mute');
		}
	}
	
		
	p.handlebtn_help = function() {
		sf.Sound.buttonClick();
		console.log("Sorry, haven't done help yet");
	}
	
	
		


	// start game button clicked
	p.handleStartButton = function() {
		g.comm.writeEvent("act", {action:"start"});
		// hide previous game's results, if any
		this.displayResultsDone();
	}

	// handle show results button
	p.handleShowResultsButton = function() {
		sf.Sound.buttonClick();
		if (this.lastTurnResults) this.displayResults(this.lastTurnResults);
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
		var facing = (i >= GameRoom.MAX_PLAYERS/2) ? 0 : 1;
		var player = this.layers.playerLayer.addChild(new sf.GameRoomPlayer(i, facing, playerInfo, textElement));
		this.players[i] = player;
		this.playersByID[playerInfo.id] = player;
		this.looksByID[playerInfo.id] = _.cloneDeep(playerInfo.avatar);
		
		// set its location
		player.x = 4 + 86*i + (i > 0) * 5;	// 5 pixels extra space after the first opsition
		player.y = 23;
		
		player.start();
		
		if (playerInfo.started) player.setActed(); // show to new entrant to room whether existing players have voted to start
		
		player.addEventListener('mousedown', this.playerMouseEvent.bind(this));
		player.addEventListener('pressmove', this.playerMouseEvent.bind(this));
		player.addEventListener('pressup', this.playerMouseEvent.bind(this));
	}
	
	
	p.removePlayer = function(playerID) {
		var player = this.playersByID[playerID];
		this.layers.playerLayer.removeChild(player);
		delete this.playersByID[playerID];
		this.players[player.position] = undefined;
		
		// get the text element back from the player
		this.textElements.push(player.textElement);
		player.destroy();
		
		player.removeAllEventListeners();
		
		// if action tag is under this player, get rid of it
		if (this.items.actionStatusTag.player == player) {
			this.items.actionStatusTag.player = undefined;
			this.items.actionStatusTag.visible = false;
		}
	}
	
	
	
	// setTimer to time - if running is false, don't count down
	p.setTimer = function(time, running) {
		if (running != false) this.startTimer();
		else this.stopTimer();
		this.timerTime = time;
		
		this.items.console.setTimer(this.timerTime);
	}
	
	p.startTimer = function() {
		if (!this.timerNextTick) this.timerNextTick = createjs.Ticker.getTime() + 1000;
	}
	
	p.stopTimer = function() {
		this.timerNextTick = undefined;
	}
	
	p.getTimer = function() {
		return this.timerTime;
	}
	
	// updateTimer returns true if timer hits 0
	p.updateTimer = function() {
		if (!this.timerNextTick) return;
		
		var now = createjs.Ticker.getTime();
		if (now >= this.timerNextTick && this.timerTime > 0) {
			this.timerTime -= 1;
			this.items.console.setTimer(this.timerTime);
			
			// time's up?
			if (this.timerTime == 0) {
				this.timerNextTick = undefined;
				// let the server know i failed to move before timer ran out
				comm.writeEvent('act', {action:'timeout'});
				return true;
			}
			else {
				this.timerNextTick += 1000;
			}
		} 
		
		return false;
	}
	
	
	// player menu handling
	p.playerMouseEvent = function(event) {
		var player = event.currentTarget;
		
		if (event.type=='mousedown') {
			this.removeActionMenu();
			
			var whichMenu;  // nothing, boot, self, or action?
			var clickedMe = (player.playerInfo.id == this.me)  // clicked on self avatar or other's avatar?
			if (this.state=='pregame') {
				return; // for now, hide the boot menu since the function's not implemented
				
				if (!clickedMe) whichMenu = 'boot';
				else return;
			}
			else if (this.state=='game') {
				// disable all menus if current player has lost
				if (this.playersByID[this.me].hasLost()) return;
			
				if (clickedMe) whichMenu = 'self';
				else {
					// disable menu on opponents who have lost already
					if (player.hasLost()) return;
					
					whichMenu = 'other';
				}
			}
			else return;
		
			this.items.actionMenu = this.layers.actionMenuLayer.addChild(new sf.GameActionMenu(this.assets, whichMenu, this.lollyCounter, this.tattleCounter));
			this.items.actionMenu.x = player.x;
			this.items.actionMenu.y = player.y+108;
			
			this.items.actionMenu.mouseDrag(event);
		}
		
		else if (event.type=='pressmove') {
			if (this.items.actionMenu) this.items.actionMenu.mouseDrag(event);
		}
		
		else if (event.type=='pressup') {
			if (this.items.actionMenu) {
				var selectedAction = this.items.actionMenu.getSelectedAction();
				
				// tell the server (cower/lick/tattle don't have a target)
				if (selectedAction) {
					sf.Sound.play('snd_action_select');
				
					var action = {action:selectedAction};
					if (selectedAction=='grab' || selectedAction=='scratch' || selectedAction=='tease') {
						action.target = player.playerInfo.id;
					}
					g.comm.writeEvent('act', action);
				
					// show the choice on target player
					this.setPlayerActionTag(player, selectedAction);
				}

				// get rid of menu
				this.removeActionMenu();
			}
		}
	}
	
	p.removeActionMenu = function() {
		if (this.items.actionMenu) {
			this.layers.actionMenuLayer.removeChild(this.items.actionMenu);
			this.items.actionMenu.destroy();
			this.items.actionMenu.removeAllEventListeners();
			this.items.actionMenu = undefined;
		}
	}
	
	
	// Display tag under player showing action you've chosen against them.  There can be only one at a time.
	// With no arguments, clears all action tags.
	p.setPlayerActionTag = function(targetPlayer, action) {
		if (!targetPlayer) {
			this.items.actionStatusTag.visible = false;
			this.items.actionStatusTag.player = undefined;
		}
		else {
			// lick, tattle, and cower are always marked on self, regardless of who the user clicked on to choose them.	
			if (action=='lick' || action=='cower' || action=='tattle') targetPlayer = this.playersByID[this.me];
			
			this.items.actionStatusTag.gotoAndStop('act_status_' + action);
			this.items.actionStatusTag.visible = true;
			this.items.actionStatusTag.player = targetPlayer;
			
			if (action != 'tattle') {
				this.items.actionStatusTag.x = targetPlayer.x;				
			}
			else {
				// tattle tag should be centered across all opponents, so find leftmost and rightmost and split the difference
				// TODO: don't count opponents who have already lost the game
				var leftmost = 9999, rightmost = 0;
				_.each(this.playersByID, function(player) {
					if (player.x < leftmost) leftmost = player.x;
					if (player.x > rightmost) rightmost = player.x;
				}, this);
				this.items.actionStatusTag.x = Math.floor((leftmost + rightmost) / 2);
			}

		}
	}
	
	
	// show the turn results pictures
	p.displayResults = function(results) {
		this.displayResultsDone(); // get rid of previous round's results, if any
		this.items.console.disableShowResults();
		this.items.resultsDisplay = this.layers.resultsLayer.addChild(new sf.GameRoomResultsDisplay(this.assets, this.looksByID, results));
		this.items.resultsDisplay.x = 88;  // moved right from original design enough to not cover the chat box
		this.items.resultsDisplay.y = 119;
		this.items.resultsDisplay.start();
		this.items.resultsDisplay.addEventListener('done', this.displayResultsDone.bind(this));
	}
	
	// hide turn results and re-enable results button
	// (pass destroy='destroy' when tearing down the gameroom to skip the re-enabling)
	p.displayResultsDone = function(destroy) {
		if (this.sounds.polaroidloop) {
			this.sounds.polaroidloop.stop();
		}
		if (this.items.resultsDisplay) {
			this.items.resultsDisplay.removeAllEventListeners();
			this.layers.resultsLayer.removeChild(this.items.resultsDisplay);
			this.items.resultsDisplay.destroy();
			this.items.resultsDisplay = undefined;
		}
		if (destroy!='destroy') this.items.console.enableShowResults();
	}
	
	
	
	p.prepareButtons = function() {
		this.buttons = {};
		var someButtons = {
			btn_exitgame:		[445, 3, this],
			btn_mute:			[445, 229, this],
			btn_help:			[480, 229, this],
			
			btn_chat:			[87, 246, this],
			btn_chatmode_loud:	[90, 226, this]
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
		_.each(['gameroom_bgitems', 'gameroom_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
	sf.GameRoom = GameRoom;


})()