// Homeroom Game Listing extends Container

// parts of a game listing on the Homeroom blackboard:
//	JOIN button (can be replaced with fighting / full tag)
//	game name
//	list of occupant nicknames


// namespace:
this.sf = this.sf||{};

(function() {

var HomeroomGameListing = function(gameInfo, tooltip) {
  this.initialize(gameInfo, tooltip);
}

var p = HomeroomGameListing.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(gameInfo, tooltip) {
		this.Container_initialize();	
		
		this.prepareAssets();
		
		this.gameID = gameInfo.room;
		this.customRulesToolTip = tooltip;
		

		this.items = {};
		
		this.items.join = this.addChild(this.assets.btn_join.clone());
		this.items.join.helper = new createjs.ButtonHelper(this.items.join, 'btn_join', 'btn_join', 'btn_join_pressed');
		this.items.join.addEventListener('click', function() {
			sf.Sound.buttonClick();
			this.dispatchEvent({type:'joingame', room:gameInfo.room})
		}.bind(this));
		
		this.items.status = this.addChild(this.assets.label_full.clone());

		this.updateStatus(gameInfo);
		
		var gameDescription = sf.GameRoom.describeGame(gameInfo); // returns {summary:"", long:""}

		
		this.items.name = this.addChild(new createjs.Text(gameInfo.roomName + " " + gameDescription.summary, config.getFont('homeroomRoomName'), '#eeeeee'));
		this.items.name.x = 71;
		this.items.name.y = 0;
		this.items.name.lineWidth = 259;
		
		var nicknames = _.pluck(gameInfo.occupants, 'nickname').join(", ");
		this.items.occupants = this.addChild(new createjs.Text(nicknames, config.getFont('homeroomOccupantNames'), '#00ffff'));
		//this.items.occupants.lineWidth = 259;
		this.items.occupants.lineHeight = 12;
		this.items.occupants.x = 71;
		this.items.occupants.y = 11;
		
		if (gameDescription.long) {			
			var ctHit = this.items.name.hitArea = new createjs.Shape();
			ctHit.graphics.beginFill('#ffffff').drawRect(-2,-2,259,22).endFill();
			
			this.items.name.on('mouseover', function(e){ 
				var pt = this.localToGlobal(75,14);
				this.customRulesToolTip.show(gameDescription.long, pt.x, pt.y);
			}, this);
			this.items.name.on('mouseout', function(e){ 
				this.customRulesToolTip.hide();
			}, this);		
		}
	}	
	
	
	
	p.start = function() {

	}
	
	p.destroy = function() {
		
	}
	
	p.update = function(gameInfo) {
		this.updateStatus(gameInfo);
		this.items.occupants.text = _.pluck(gameInfo.occupants, 'nickname').join(", ");
	}
	
	
	p.updateStatus = function(gameInfo) {
		switch(gameInfo.status) {
			case 'open':
				this.items.join.gotoAndStop('btn_join');
				this.items.join.visible = true;
				this.items.status.visible = false;
				break;
			case 'full':
				this.items.status.gotoAndStop('label_full');
				this.items.status.visible = true;
				this.items.join.visible = false;
				break;
			case 'fighting':
				this.items.status.gotoAndStop('label_fighting');
				this.items.status.visible = true;
				this.items.join.visible = false;
				break;
			default:
				this.items.status.visible = false;
				this.items.join.visible = false;
				console.log('HomeroomGameListing got game with unknown status: ', gameInfo);
				break;
		}
	}
	
	
	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_listing_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
	
		
	sf.HomeroomGameListing = HomeroomGameListing;


})()