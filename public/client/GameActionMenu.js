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
				console.log('GameActionMenu added menu button ' + assetName);
				var button = this.buttons[b] = this.addChild(this.assets[assetName].clone());
				// make a hitarea that's as wide as the menu (74) and as high as the button (variable)
				var buttonFrame = button.spriteSheet._frames[button.currentFrame];
				var hitArea = this.addChild(new createjs.Shape());
				hitArea.visible = false;
				hitArea.graphics.f('#fff').r(4,-buttonFrame.regY, 74,buttonFrame.rect.height);
				button.helper = new createjs.ButtonHelper(button, 'act_menu_invisible', assetName, assetName, false, hitArea);
				button.addEventListener('click', function() {
					this.dispatchEvent(b);
					console.log("GameActionMenu.click", b, button);
				}.bind(this));
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



	sf.GameActionMenu = GameActionMenu;
	
	
})();