// Homeroom Create Game Dialog extends Container



// namespace:
this.sf = this.sf||{};

(function() {

var HomeroomCreateGameDialog = function() {
  this.initialize();
}

var p = HomeroomCreateGameDialog.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function() {
		this.Container_initialize();	
		
		this.prepareAssets();
		
		this.items = {};
		this.layOutItems();
		this.activateButtons();
		
		this.items.gameName = new createjs.DOMElement(document.getElementById('homeroomCreateGameEntry'));
		
		this.items.gameName.setFakeScale(g.gameScale);
		this.items.gameName.setPosition(293, 81);
		this.items.gameName.setSize(83, 12);
		this.items.gameName.setVisible(false);
		this.items.gameName.htmlElement.value = "";
		
		this.moves = _.cloneDeep(config.homeroom.custom_games.regular.moves);
		this.timer = 90;
	}
	
	p.destroy = function() {
		this.items.gameName.setVisible(false);
		this.items.gameName.htmlElement.onkeypress = null;
	}
	
	
	
	p.open = function() {
		this.setGameType('regular');
		this.setTimer(90);
		this.items.gameName.setVisible(true);
		this.items.gameName.htmlElement.value = "";
		this.items.gameName.htmlElement.focus();
	}
	
	
	// highlight game name buttons and allowed-move buttons to correspond to game name
	//   if gameType doesn't match one of the six named games (that shouldn't happen!), none will be highlighted
	p.setGameType = function(gameType) {
		//console.log(this.moves, _.reduce(this.items.allowedMoveButtons, function(rest, btn, moveName){return rest+" "+moveName+":"+btn.helper.currentStateIndex}, "->"));
		_.each(config.homeroom.custom_games, function(gameDef, gameId) {
			// highlight game name
			var customGameButtonName = 'btn_' + gameId;
			var customGameButton = this.items[customGameButtonName];
			if (gameType==gameId) {
				customGameButton.helper.setState('selected');
				// highlight corresponding moves
				this.moves = _.cloneDeep(config.homeroom.custom_games[gameType].moves);
				_.each(this.moves, function(moveAllowed, moveId) {
					var moveButton = this.items.allowedMoveButtons[moveId];
					if (moveAllowed) moveButton.helper.setState('yes');
					else moveButton.helper.setState('no');
				}, this);
			}
			else customGameButton.helper.setState('unselected');
		}, this);
	}
	
	// when individual moves are toggled, check to see if the result matches any of the named games
	p.findGameType = function(moveButtons) {
		//console.log(this.moves, _.reduce(this.items.allowedMoveButtons, function(rest, btn, moveName){return rest+" "+moveName+":"+btn.helper.currentStateIndex}, ">>"));
		var matchedGame;
		_.each(config.homeroom.custom_games, function(gameDef, gameId) {
			// compare current game with named game, reject if match fails
			matchedGame = gameId;
			_.each(gameDef.moves, function(yesno, move) {
				if (yesno != moveButtons[move]) {
					matchedGame = null;
					return false; // lodash equivalent of break
				}
			}, this)
			if (matchedGame) return false; // lodash equivalent of break
		}, this);
		
		// found a match?
		if (matchedGame) this.setGameType(matchedGame);
		else this.setGameType(null);
	}
	
	// wire up buttons to handlers
	p.activateButtons = function() {
		// fairly normal buttons:
		_.each(['btn_newgame_cancel', 'btn_newgame_ok', 'btn_specialrules', 'btn_specialrules_sel'], function(buttonName) {
			var button = this.items[buttonName];
			button.helper = new createjs.ButtonHelper(button, buttonName, buttonName, buttonName, false);
			button.addEventListener('click', function() {console.log("clicked " + buttonName); sf.Sound.buttonClick();});
		}, this);
		
		
		// custom game names
		_.each(config.homeroom.custom_games, function(info, gamename) {
			var buttonName = 'btn_' + gamename;
			var button = this.items['btn_' + gamename];
			var bounds = button.getBounds();
			var hitArea = new createjs.Shape();
			hitArea.graphics.beginFill('#fff').rect(bounds.x,bounds.y,bounds.width,bounds.height+3).endFill();
			button.helper = new sf.MultiButtonHelper(button, {selected:{out:buttonName+'_sel'}, unselected:{out:buttonName}}, 'unselected', false, hitArea);
			button.addEventListener('multiclick', function(e) {console.log("clicked " + gamename + " " + e.state);this.setGameType(gamename); sf.Sound.buttonClick();}.bind(this));
		}, this);		
		
		// allowed move checkboxes
		_.each(['scratch', 'grab', 'tease', 'tattle', 'lick', 'cower'], function(move) {
			var button = this.items.allowedMoveButtons[move];
			var bounds = button.specialBounds;
			var hitArea = new createjs.Shape();
			hitArea.graphics.beginFill('#fff').rect(bounds.x-button.x,bounds.y-button.y,bounds.w,bounds.h).endFill();
			button.helper = new sf.MultiButtonHelper(button, {yes:{out:'btn_checkbox_yes',next:'no'}, no:{out:'btn_checkbox_no',next:'yes'}}, 'yes', false, hitArea);
			button.addEventListener('state', function(e) {console.log("clicked " + move + " " + e.state); this.moves[move]=(e.state=='yes'?1:0);this.findGameType(this.moves); sf.Sound.buttonClick();}.bind(this));
		}, this);
	}
	
	
	p.layOutItems = function() {
		this.items.regularLayout = this.addChild(new createjs.Container());
		this.items.customLayout = this.addChild(new createjs.Container());
		this.items.regularLayout.visible = false;
		this.layOutItemsIn(this, ['bg_newgame', 'btn_newgame_cancel', 'btn_newgame_ok']);
		this.layOutItemsIn(this.items.regularLayout, ['btn_specialrules', 'btn_specialrules_tag_no']);
		this.layOutItemsIn(this.items.customLayout, ['btn_specialrules_sel', 'btn_specialrules_tag_yes','label_timer', 'label_choose', 
				'btn_opiumden', 'btn_tigersden', 'btn_taintedlove', 'btn_teasetag', 'btn_catbutt', 'btn_regular']);
				
		this.items.allowedMoveButtons = {};
		_.each([
					{move:'scratch', 	checkbox:{x:35,y:134}, bounds:{x:10,y:123,w:59,h:21}},
					{move:'grab', 		checkbox:{x:90,y:134}, bounds:{x:76,y:123,w:35,h:21}},
					{move:'tease',	 	checkbox:{x:135,y:134}, bounds:{x:119,y:123,w:41,h:21}},
					{move:'tattle', 	checkbox:{x:216,y:134}, bounds:{x:195,y:123,w:47,h:21}},
					{move:'lick',	 	checkbox:{x:260,y:134}, bounds:{x:251,y:123,w:29,h:21}},
					{move:'cower',	 	checkbox:{x:307,y:134}, bounds:{x:289,y:123,w:44,h:21}},					
				], function(info) {
			var checkbox = this.items.allowedMoveButtons[info.move] = this.items.customLayout.addChild(this.assets['btn_checkbox_yes'].clone());
			checkbox.x = info.checkbox.x;
			checkbox.y = info.checkbox.y;
			checkbox.specialBounds = info.bounds;
		}, this);
	}
	
	p.layOutItemsIn = function(container, which) {
		_.each(which, function(itemName) {
			this.items[itemName] = container.addChild(this.assets[itemName].clone());
			this.items[itemName].x = this.assets[itemName].layout.x;
			this.items[itemName].y = this.assets[itemName].layout.y;
		}, this);
	}
	
	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
		
	sf.HomeroomCreateGameDialog = HomeroomCreateGameDialog;


})()
