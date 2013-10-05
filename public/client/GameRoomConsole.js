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
		
		this.items.btn_start = this.items.pregame.addChild(this.assets.btn_start.clone());
		this.items.btn_start.x = 307;
		this.items.btn_start.y = 17;
		this.items.btn_start.helper = new createjs.ButtonHelper(this.items.btn_start, 'btn_start', 'btn_start', 'btn_start_pressed');
	}
	
	
	p.start = function() {
		this.setMode('pregame');
		this.items.btn_start.addEventListener('click', function(){this.dispatchEvent('start')}.bind(this));
	}
	p.destroy = function() {
		
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
	
		
		
	sf.GameRoomConsole = GameRoomConsole;


})()