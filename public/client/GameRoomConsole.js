// GameRoomConsole extends Container


// namespace:
this.sf = this.sf||{};

(function() {

// constructor args:
//	assets - borrow assets from gameroom
//	color - uniformcolor 0-5 for matching console to uniform (TODO)
var GameRoomConsole = function() {
  this.initialize.apply(this, arguments);
}

var p = GameRoomConsole.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(assets, color) {
		this.Container_initialize();
		
		this.assets = assets;
		this.color = color;
		
		this.mode = 'pregame';
		
		
		this.items = {};
		
		this.items.bg = this.addChild(this.assets.console_pregame.clone());

		this.items.pregame = this.addChild(new createjs.Container());
		this.items.game = this.addChild(new createjs.Container());
		
		// items for pregame console
		this.items.btn_start = this.items.pregame.addChild(this.assets.btn_start.clone());
		this.items.btn_start.x = 307;
		this.items.btn_start.y = 17;
		this.items.btn_start.helper = new createjs.ButtonHelper(this.items.btn_start, 'btn_start', 'btn_start', 'btn_start_pressed');
		
		// items for game console
		this.items.timer1 = this.items.game.addChild(this.assets.digit_0.clone());
		this.items.timer1.x = 297;
		this.items.timer1.y = 19;
		this.items.timer0 = this.items.game.addChild(this.assets.digit_0.clone()); 
		this.items.timer0.x = 323;
		this.items.timer0.y = 19;
		
		this.items.lollyCounter = this.items.game.addChild(this.assets.counter_0.clone()); 
		this.items.lollyCounter.x = 350;
		this.items.lollyCounter.y = 25;
		this.items.tattleCounter = this.items.game.addChild(this.assets.counter_0.clone());
		this.items.tattleCounter.x = 350;
		this.items.tattleCounter.y = 41;	
		
		this.items.btn_showResults = this.items.game.addChild(this.assets.show_results_btn.clone());
		this.items.btn_showResults.x = 388;
		this.items.btn_showResults.y = 8;
		this.disableShowResults();	
		
		this.setMode('pregame');
	}
	
	
	p.start = function() {
		this.items.btn_start.addEventListener('click', function(){this.dispatchEvent('start')}.bind(this));
		this.items.btn_showResults.addEventListener('click', function(){this.dispatchEvent('showResults')}.bind(this));
	}
	p.destroy = function() {
		this.items.btn_start.removeAllEventListeners();
		this.items.btn_showResults.removeAllEventListeners();
	}
	
	p.setMode = function(mode) {
		this.mode = mode;
		if (mode=='game') {
			this.items.bg.gotoAndStop('console_game');
			this.items.pregame.visible = false;
			this.items.game.visible = true;
		}
		else {
			this.items.bg.gotoAndStop('console_pregame');
			this.items.pregame.visible = true;
			this.items.game.visible = false;
		}
	}
	
	// set timer to number (0-99)
	p.setTimer = function(time) {
		var digit0 = time % 10;
		var digit1 = ((time - digit0)/10) % 10;
		this.items.timer0.gotoAndStop('digit_' + digit0);
		this.items.timer1.gotoAndStop('digit_' + digit1);
	}
	
	
	// set number of lollies (0-3) and tattles (0-2)
	p.setLolliesAndTattles = function(lollies, tattles) {
		this.items.lollyCounter.gotoAndStop('counter_' + lollies);
		this.items.tattleCounter.gotoAndStop('counter_' + tattles);
	}
	
	
	p.disableShowResults = function() {
		this.items.btn_showResults.visible = false;
	}
	p.enableShowResults = function() {
		this.items.btn_showResults.visible = true;
	}
		
		
	sf.GameRoomConsole = GameRoomConsole;


})()