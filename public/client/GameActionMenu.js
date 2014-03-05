// GameActionMenu extends Container


// namespace:
this.sf = this.sf||{};

(function() {

// constructor args:
//	assets - borrow assets from gameroom
//	which - boot, self, or other
//	lick, tattle (boolean) - truish if user still has lollies / tattles left
var GameActionMenu = function() {
  this.initialize.apply(this, arguments);
}

var p = GameActionMenu.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(assets, which, lick, tattle) {
		this.Container_initialize();
		
		this.assets = assets;
		
		//this.cursor = 'pointer'; // doesn't work :(
		
		this.items = [];
		var prefix='act_menu_', btns=[];
		
		if (which=='boot') {
			this.items.bg = this.addChild(this.assets.boot_menu_bg.clone());
			btns = ['boot', 'dont'];
			prefix = 'boot_menu_';
		}
		else if (which=='self') {
			this.items.bg = this.addChild(this.assets.self_menu_bg.clone());
			btns = ['cower', 'lick', 'tattle'];
		}
		else {
			this.items.bg = this.addChild(this.assets.act_menu_bg.clone());
			var btns = ['grab', 'scratch', 'tease', 'cower', 'lick', 'tattle'];
		}
		
		this.buttons = [];
		_.each(btns, function(b){
			if ((b=='lick' && !lick) || (b=='tattle' && !tattle)) {
				// leave out the disabled buttons
			}
			else {
				var assetName = prefix+b;
				var button = this.buttons[b] = this.addChild(this.assets[assetName].clone());
				button.visible = false;  // visible only on rollover
				button.actionLabel = b;
			}
		}, this);
	}
	
	
	p.start = function() {
		
	}
	
	p.destroy = function() {
		_.each(this.buttons, function(b) {
			b.removeAllEventListeners();
		}, this);
	}
	
	
	// gameroom forwards drag event to me - use it to figure out which menu entry to highlight
	p.mouseDrag = function(event) {
		var mouse = this.globalToLocal(event.stageX, event.stageY);
		this.selectedAction = undefined;
		_.forOwn(this.buttons, function(button) {
			var bounds = button.getBounds();
			if (mouse.x > 1 && mouse.x < 79 && mouse.y >= bounds.y && mouse.y <= (bounds.y+bounds.height+1)) {
				button.visible = true;
				this.selectedAction = button.actionLabel;
			}
			else {
				button.visible = false;
			}
		}, this);
	}

	p.getSelectedAction = function() {
		return this.selectedAction;
	}


	sf.GameActionMenu = GameActionMenu;
	
	
})();