// AddonsList extends Container

// namespace:
this.sf = this.sf||{};

(function() {

var AddonsList = function(dressingRoom, look, addons) {
  this.initialize(dressingRoom, look, addons);
}

var p = AddonsList.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;

	// look - current avatar settings
	// addons - list of addons
	p.initialize = function(dressingRoom, look, addons) {
		this.Container_initialize();
		
		this.background = this.addChild(new createjs.Shape());
		
		
		this.dressingRoom = dressingRoom;
		
		this.assets = {};
		this.assets.ptr_addon = dressingRoom.assets.ptr_addon;
		this.assets.ptr_addon_disabled = dressingRoom.assets.ptr_addon_disabled;
		
		this.column = 0;
		this.row = 0;
		
		if (!look.addons) look.addons = [];
		
		// query Avatar for list of addons that conflict with current ones
		var conflicts;
		if (look.addons.length >= config.avatar.MAX_ADDONS) {
			conflicts = "all";
		}
		else {
			conflicts = sf.Avatar.listConflicts(look.addons);
		}
		
		this.addItem({text:"APPROVED SCHOOLWEAR", width:'double'});
		this.addItem({text:" ", width:'double'});
		
		
		for (var u=0; u<config.number.of.uniform; u++) {
			this.addItem({text:config.dressing.uniformNames[u], feature:'uniform', value:u, selected:(u==look.uniform)});
		}
		
		this.addItem({text:" ", width:'double'});
		this.addItem({text:"* FORBIDDEN ITEMS!!! *"});
		this.addItem({text:" ", width:'double'});
		
		// show custom items first
		_(addons).filter(this.availableAddonIsCustom(true)).each(function(addon) {
			this.addItem({text:addon.name, feature:'addon', id:addon.id, width:'double', 
							selected:_(look.addons).contains(addon.id), 
							disabled:conflicts=='all' || _(conflicts).contains(addon.id)})
		}, this);		
		
		// and now the rest
		_(addons).filter(this.availableAddonIsCustom(false)).each(function(addon) {
			this.addItem({text:addon.name, feature:'addon', id:addon.id, 
							selected:_(look.addons).contains(addon.id), 
							disabled:conflicts=='all' || _(conflicts).contains(addon.id)})
		}, this);
		
		// pad out the end of the paper a bit:
		//   if shorter than one screen, extend paper to almost fill the screen
		if (!this.getScrollable()) {
			while (!this.getAlmostScrollable()) {
				this.addItem({text:" ", width:'double'});
			}
		}
		//   if already scrollable, just add a few extra lines to make the scrolling more pleasant
		else {
			for (var i=0; i<4; i++) this.addItem({text:" ", width:'double'});
		}
	}
	
	p.getScrollHeight = function() {
		return (this.row * config.dressing.addons.ROW_HEIGHT);
	}
	p.getScrollable = function() {
		return (config.dressing.addons.TALL_PX <= this.getScrollHeight());
	}
	p.getAlmostScrollable = function() {
		return (config.dressing.addons.TALL_PX <= this.getScrollHeight() + 10);
	}


	// helper function: get list of available addons that are / aren't custom
	// for now, custom addons are those with id between 400 and 499 - might want to add special custom property instead in the future
	p.availableAddonIsCustom = function(flag) {
		return function(addon) {return !addon.available && (flag==(addon.id >= 400 && addon.id < 500))};
	}
	
	
	p.addItem = function(item) {
		var dressingRoom = this.dressingRoom;
		
		if (item.width=='double' && this.column == 1) {
			this.decorateRow();
			this.row ++;
			this.column = 0;
		}
		var button = new createjs.Container();
		button.text = button.addChild(new createjs.Text(item.text, config.getFont('dressingRoomAddons')));
		if (item.selected) {
			var selected = button.addChild(this.assets.ptr_addon.clone());
			if (item.width=='double') selected.scaleX = 1.7;
			button.cursor = "pointer";
			button.addEventListener("click", function(event) { dressingRoom.addonsListClick(event.target.item) });
		} else if (item.disabled) {
			var disabled = button.addChild(this.assets.ptr_addon_disabled.clone());
			if (item.width=='double') disabled.scaleX = 1.7;
		} else if (item.feature) {
			button.cursor = "pointer";
			button.addEventListener("click", function(event) { dressingRoom.addonsListClick(event.target.item) });
		}
		
		var hitWidth = 70;
		if (item.width=='double') hitWidth = 140;
		
		button.hitArea = new createjs.Shape(new createjs.Graphics().f('#fff').r(0,0,hitWidth,9));
		
		button.x = 13 + this.column * config.dressing.addons.COL_WIDTH;
		button.y = this.row * config.dressing.addons.ROW_HEIGHT;
		
		button.item = item;
		
	
		this.addChild(button);
		
		this.column = this.column + (item.width=='double') ? 2 : 1;
		if (this.column >= config.dressing.addons.NUM_COLS) {
			this.decorateRow();
			this.row ++;
			this.column = 0;
		}

	}
	

			
	p.decorateRow = function() {	
		// draw fanfold paper stripes and punches
		var yy = this.row * config.dressing.addons.ROW_HEIGHT;
		this.background.graphics.f(config.dressing.addons.hole_color).de(3,yy, 5,5).de(152,yy, 5,5);
		if (this.row % 2 == 0) {
			this.background.graphics
				.f(config.dressing.addons.stripe_color)
				.r(11, yy, 139, config.dressing.addons.ROW_HEIGHT);
		}
	}






	sf.AddonsList = AddonsList;

}())