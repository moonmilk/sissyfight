// Homeroom Game Listing extends Container

// parts of a game listing on the Homeroom blackboard:
//	JOIN button (can be replaced with fighting / full tag)
//	game name
//	list of occupant nicknames


// namespace:
this.sf = this.sf||{};

(function() {

var HomeroomGameListing = function(gameInfo) {
  this.initialize(gameInfo);
}

var p = HomeroomGameListing.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(gameInfo) {
		this.Container_initialize();	
		
		this.prepareAssets();
		

		this.items = {};
		
		this.items.join = this.addChild(this.assets.btn_join.clone());
		this.items.join.x = 20;
		switch(gameInfo.status) {
			case 'open':
				this.items.join.gotoAndStop('btn_join');
				break;
			case 'full':
				this.items.join.gotoAndStop('label_full');
				break;
			case 'fighting':
				this.items.join.gotoAndStop('label_fighting');
				break;
		}
		
		this.items.name = this.addChild(new createjs.Text(gameInfo.name));
		this.items.name.x = 78;
		this.items.name.y = 6;
		
		var nicknames = gameInfo.occupants.join(", ");
		this.items.occupants = this.addChild(new createjs.Text(nicknames));
		this.items.occupants.lineWidth = 192;
		this.items.occupants.lineHeight = 12;
		this.items.occupants.x = 147;
		
	}	
	
	
	
	p.start = function() {

	}
	
	p.destroy = function() {
		
	}
	
	p.update = function(gameInfo) {
		
	}
	
	
	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_listing_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
	
		
	sf.HomeroomGameListing = HomeroomGameListing;


})()