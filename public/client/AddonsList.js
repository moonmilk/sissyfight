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
		this.assets = {};
		this.assets.ptr_addon = dressingRoom.assets.ptr_addon;
		this.assets.ptr_addon_disabled = dressingRoom.assets.ptr_addon_disabled;
		
		this.NUM_COLUMNS = 2;
		this.column = 0;
		this.row = 0;
		
		if (!look.addons) look.addons = [];
		
		// query Avatar for list of addons that conflict with current ones
		var conflicts = sf.Avatar.listConflicts(look.addons);
		
		this.addItem({text:"APPROVED SCHOOLWEAR", width:'double'});
		this.addItem({text:"-------------------", width:'double'});
		
		
		for (var u=0; u<config.number.of.uniform; u++) {
			this.addItem({text:config.dressing.uniformNames[u], feature:'uniform', value:u, selected:(u==look.uniform)});
		}
		
		this.addItem({text:"", width:'double'});
		this.addItem({text:"* FORBIDDEN ITEMS!!! *"});
		this.addItem({text:"", width:'double'});
		
		// show custom items first
		_(addons).filter(this.availableAddonIsCustom(true)).each(function(addon) {
			this.addItem({text:addon.name, id:addon.id, width:'double', selected:_(look.addons).contains(addon.id), disabled:_(conflicts).contains(addon.id)})
		}, this);		
		
		// and now the rest
		_(addons).filter(this.availableAddonIsCustom(false)).each(function(addon) {
			this.addItem({text:addon.name, id:addon.id, selected:_(look.addons).contains(addon.id), disabled:_(conflicts).contains(addon.id)})
		}, this);
		
	}


	// helper function: get list of available addons that are / aren't custom
	// for now, custom addons are those with id between 400 and 499 - might want to add special custom property instead in the future
	p.availableAddonIsCustom = function(flag) {
		return function(addon) {return !addon.available && (flag==(addon.id >= 400 && addon.id < 500))};
	}
	
	
	p.addItem = function(item) {
		console.log(item);
	}
	


	sf.AddonsList = AddonsList;

}())