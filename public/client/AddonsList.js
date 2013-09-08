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
		this.addItem({text:"", width:'double'});
		
		
		for (var u=0; u<config.number.of.uniform; u++) {
			this.addItem({text:config.dressing.uniformNames[u], feature:'uniform', value:u, selected:(u==look.uniform)});
		}
		
		this.addItem({text:"", width:'double'});
		this.addItem({text:"* FORBIDDEN ITEMS!!! *"});
		this.addItem({text:"", width:'double'});
		
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
		
	}


	// helper function: get list of available addons that are / aren't custom
	// for now, custom addons are those with id between 400 and 499 - might want to add special custom property instead in the future
	p.availableAddonIsCustom = function(flag) {
		return function(addon) {return !addon.available && (flag==(addon.id >= 400 && addon.id < 500))};
	}
	
	
	p.addItem = function(item) {
		var dressingRoom = this.dressingRoom;
		
		if (item.width=='double' && this.column == 1) {
			this.row ++;
			this.column = 0;
		}
		var button = new createjs.Container();
		button.text = button.addChild(new createjs.Text(item.text, "9px Courier"));
		if (item.selected) {
			button.addChild(this.assets.ptr_addon.clone());
			button.cursor = "pointer";
			button.addEventListener("click", function(event) { dressingRoom.addonsListClick(event.target.item) });
		} else if (item.disabled) {
			button.addChild(this.assets.ptr_addon_disabled.clone());
		} else if (item.feature) {
			button.cursor = "pointer";
			button.addEventListener("click", function(event) { dressingRoom.addonsListClick(event.target.item) });
		}
		
		button.hitArea = new createjs.Shape(new createjs.Graphics().f('#fff').r(0,0,70,9));
		
		button.x = 13 + this.column * config.dressing.addons.COL_WIDTH;
		button.y = this.row * config.dressing.addons.COL_HEIGHT;
		
		button.item = item;
		
	
		this.addChild(button);
		
		this.column = this.column + (item.width=='double') ? 2 : 1;
		if (this.column >= config.dressing.addons.NUM_COLS) {
			this.row ++;
			this.column = 0;
		}
	}
	



	sf.AddonsList = AddonsList;

}())