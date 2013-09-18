// DressingRoom extends Container

// namespace:
this.sf = this.sf||{};

(function() {

var DressingRoom = function(look, nickname) {
  this.initialize(look, nickname);
}

var p = DressingRoom.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(look, nickname) {
		this.Container_initialize();	
		this.look = look;
		
		// set up random defaults if this is a new character
		if (this.look.skincolor === undefined) this.look.skincolor = Math.floor(Math.random()*config.number.of.skincolor);
		if (this.look.haircolor === undefined) this.look.haircolor = Math.floor(Math.random()*config.number.of.haircolor);
		if (this.look.uniformcolor === undefined) this.look.uniformcolor = 0;
		
		this.prepareAssets();
	
		// backdrop layer: white bg for face previews, blue bg for mirror
		this.addChild(this.assets.dressing_behind);
		
		// layer for face previews
		this.faces = new createjs.Container();
		this.addChild(this.faces);
		this.showFaces();
		
		// avatar in mirror
		this.avatar = new sf.Avatar();
		//this.look.headdir = this.look.bodydir = 0; // face left
		
		this.avatar.x = 460;
		this.avatar.y = 55;
		this.addChild(this.avatar);
		
		// nickname display
		this.nickname = new createjs.Text(nickname, "12px Arial", '#000000');
		this.nickname.x = 458 - this.nickname.getMeasuredWidth()/2;
		this.nickname.y = 202;
		this.addChild(this.nickname);

		// layer to hold addons list
		this.addonsLayer = new createjs.Container();
		this.addChild(this.addonsLayer);
		this.showAddonsList();
					
			
		// framing layer
		this.addChild(this.assets.dressing_frame)
			.addEventListener("click", function() {
				// don't do anything with clicks, just block them from parts of addon list that have scrolled underneath the frame
			});
		
				
		// layer for hair previews
		this.hair = new createjs.Container();
		this.addChild(this.hair);
		this.showHair();
		
		
		// UI elements
		_.each(['skincolor','haircolor'], function(feature) {
			var ptr = this.assets['ptr_'+feature];
			this.addChild(ptr);
			var rect = this.buttonPos(feature, this.look[feature]);
			ptr.x = rect.x;
			ptr.y = rect.y;
		}, this);
		
		this.addGenericButtons();
		
			
		// touch areas
		this.touch = new createjs.Container()
		this.addChild(this.touch);
		
		this.prepareButtons();
		
		
				
		// update avatar
		this.setFeature();
	}

	p.start = function() {
		// EXPERIMENTAL!  catch scroll events
		// http://stackoverflow.com/questions/10313142/javascript-capture-mouse-wheel-event-and-do-not-scroll-the-page
		if (this.addonsList.getScrollable()) {
			this.getStage().canvas.onmousewheel = function(event) {
				this.scrollAddons(event.wheelDeltaY);
				event.preventDefault(); 
				return false;
			}.bind(this);
		}
					
		// FOR TESTING AVATAR POSES
		var room = this;
		document.onkeypress = function(e) {
			//console.log(this, e.charCode);
			switch(e.charCode) {
				case 104: // h
					room.look.headdir = !room.look.headdir; 
					break;
				case 98: // b
					room.look.bodydir = !room.look.bodydir;
					break;
				case 102: // f
					if (!room.look.expression) room.look.expression = 0;
					room.look.expression = (room.look.expression + 1) % config.number.of.expression;
					break;
				case 112: // p
					if (!room.look.pose) room.look.pose = 0;
					room.look.pose = (room.look.pose + 1) % config.number.of.pose;
					break;
			}
			room.setFeature();
		}
		
	}
	
	// cleanup
	p.destroy = function() {
		this.getStage().canvas.onmousewheel = null;
		document.onkeypress = null;
	}
	
	
	
	// save look back to server
	p.persistLook = function(look) {
		if (!look) look = this.look;
		if (!look) {
			console.log('DressingRoom.persistLook: my this is messed up');
			return;
		}
		
		var sendLook = _.pick(look, ['face', 'skincolor', 'hairstyle', 'haircolor', 'uniform', 'uniformcolor', 'addons'] );
		
		g.comm.writeEvent('setAvatar', {avatar:sendLook});
		// should check for error returns and all that.
		g.comm.addEventListener('avatar', this.avatarDoneBound);
	}
	
	p.avatarDoneBound = function(event) {
		g.comm.removeEventListener(this.avatarDoneBound);
		console.log("Avatar saved!");
	}.bind(this)

	
	
	// can call with no args to refresh the avatar
	p.setFeature = function(feature, value) {
		if (feature) this.look[feature] = value;
		
		// convenience for debugging from console: can set face or hairstyle back to undefined
		var undressed = {};
		if (this.look.face === undefined) {
			undressed.faceless = true;
			delete this.look['face'];
		}
		if (this.look.hairstyle === undefined) {
			undressed.hairless = true;
			delete this.look['hairstyle'];
		}
		this.avatar.setLook(this.look, undressed);
		if (!undressed.faceless && !undressed.hairless) {
			// unlock the OK button when hair and face are chosen
			this.unlockOKButton();
		}
		
		if (feature==='skincolor') {
			this.showFaces();
			var destX = this.buttonPos('skincolor', value).x;
			var slide = createjs.Tween
				.get(this.assets.ptr_skincolor)
				.to({x:destX}, 100+2*Math.abs(destX - this.assets.ptr_skincolor.x), createjs.Ease.quadOut);
		}
		else if (feature==='haircolor') {
			var dest = this.buttonPos('haircolor', value);
			var dx = this.assets.ptr_haircolor.x - dest.x;
			var dy = this.assets.ptr_haircolor.y - dest.y;
			var slide = createjs.Tween
				.get(this.assets.ptr_haircolor)
				.to({x:dest.x, y:dest.y}, 100+2*Math.abs(Math.sqrt(dx*dx+dy*dy)), createjs.Ease.quadOut);
			this.showHair();
		}
		else if (feature==='uniform') {
			this.showAddonsList();
		}
		
	}
	
	
	p.showFaces = function() {
		// empty out any previous faces
		this.faces.removeAllChildren();
		for (var f=0; f<config.number.of.face; f++) {
			var face = sf.Avatar.getFaceExemplarSprite(f, this.look.skincolor||0);
			var rect = this.buttonPos('face',f);
			face.x = rect.x + 11;
			face.y = rect.y - 29;
			this.faces.addChild(face);
		}
	}
	
	p.showHair = function() {
		this.hair.removeAllChildren();
		var wig = sf.Avatar.getHairExemplarSprite(this.look.hairstyle || 0, this.look.haircolor || 0);
		wig.x = 222;
		wig.y = 36;
		this.hair.addChild(wig);
	}
	
	p.showAddonsList = function() {
		// throw away and make a new addons list (inefficient but easy)
		this.addonsLayer.removeAllChildren();
		
		// placeholder filtering - for now, just get rid of the tier -1 items (mud mask and towel) 
		var filteredAddons = _.filter(config.addons, function(addon){return addon.tier >= 0});
		
		this.addonsList = new sf.AddonsList(this, this.look, filteredAddons);
		this.addonsLayer.addChild(this.addonsList);
		this.addonsList.x = 249;
		this.addonsList.y = 22;
		
	}
	
	
	p.addGenericButtons = function() {
		var someButtons = {
			lever: 				[507,130],
			btn_ok: 			[487,250,'btn_ok_disabled'],			
		};
		// show scroll buttons only if addons list is tall enough to scroll
		if (this.addonsList.getScrollable()) {
			someButtons.btn_scroll_up =	[365,233];
			someButtons.btn_scroll_down = [385,233];
		}
		
		this.buttons = {};
		_.forOwn(someButtons, function(what,who) {
			this.buttons[who] = this.addChild(this.assets[who]);
			this.buttons[who].x = what[0];
			this.buttons[who].y = what[1];
			if (what[2]) this.buttons[who].gotoAndStop(what[2]);
		}, this);
		

	}
	
		
	p.scrollAddons = function(how) {
		if (how=='down') {
			var destY = this.addonsLayer.y + 120;
			if (destY > 0) destY = 0;
			var slide = createjs.Tween
				.get(this.addonsLayer)
				.to({y:destY}, 100+2*Math.abs(this.addonsLayer.y-destY), createjs.Ease.quadOut);
		}
	
		else if (how=='up') {
			var destY = this.addonsLayer.y - 120;
			if (destY < (config.dressing.addons.TALL_PX - this.addonsList.getScrollHeight())) {
				destY = config.dressing.addons.TALL_PX - this.addonsList.getScrollHeight();
			}
			var slide = createjs.Tween
				.get(this.addonsLayer)
				.to({y:destY}, 100+2*Math.abs(this.addonsLayer.y-destY), createjs.Ease.quadOut);
		}
		else {
			// deltaY from mouse wheel
			this.addonsLayer.y += how;
		}
		if (this.addonsLayer.y > 0) this.addonsLayer.y = 0;
		if (this.addonsLayer.y < (config.dressing.addons.TALL_PX - this.addonsList.getScrollHeight())) {
			this.addonsLayer.y = config.dressing.addons.TALL_PX - this.addonsList.getScrollHeight();
		}
	}
	
	
	
	p.prepareButtons = function() {
		var room = this; // for binding in event handlers
		
		// skin, face, and haircolor choosers
		_.each(['skincolor', 'face', 'haircolor'],function(feature) {
			for (var i=0; i<config.number.of[feature]; i++) {
				// make invisible hit areas, technique from http://community.createjs.com/discussions/easeljs/626-invisible-button
				var rect = this.buttonPos(feature,i);
				var hit = new createjs.Shape();
				hit.graphics.beginFill('#ffffff').drawRect(rect.x,rect.y,rect.width,rect.height);
				var box = new createjs.Shape();
				box.hitArea = hit;
				box.cursor = 'pointer';
				this.touch.addChild(box);
				box.info = {feature:feature, value:i};
				box.addEventListener("click",function(event){room.setFeature(event.target.info.feature, event.target.info.value)});
			}			
		}, this);
		
		// hairstyle chooser
		_.each([
			{click:room.incrementHairstyle, rect:new createjs.Rectangle(199,38,44,62)},
			{click:room.decrementHairstyle, rect:new createjs.Rectangle(176,35,22,66)}
		], function(item) {
			var hit = new createjs.Shape();
			hit.graphics.beginFill('#ffffff').drawRect(item.rect.x, item.rect.y, item.rect.width, item.rect.height);
			var box = new createjs.Shape();
			box.hitArea = hit;
			box.cursor = 'pointer';
			this.touch.addChild(box);
			box.room = room;
			box.addEventListener("click", item.click.bind(room));
		}, this);
		
		// randomizer lever
		this.buttons.lever.addEventListener("click", function(event) {
			var look = sf.Avatar.randomLook();
			_.each(['face','skincolor','hairstyle','haircolor','uniform'], function(feature) {
				room.setFeature(feature, look[feature]);
			});
		});
		this.buttons.lever.helper = new createjs.ButtonHelper(this.buttons.lever, "lever", "lever", "lever_pulled");
		
		if (this.addonsList.getScrollable()) {
			this.buttons.btn_scroll_up.addEventListener("click", function() { this.scrollAddons("up") }.bind(this));
			this.buttons.btn_scroll_up.helper = new createjs.ButtonHelper(this.buttons.btn_scroll_up, "btn_scroll_up", "btn_scroll_up", "btn_scroll_up_pressed");
			this.buttons.btn_scroll_down.addEventListener("click", function() { this.scrollAddons("down") }.bind(this));
			this.buttons.btn_scroll_down.helper = new createjs.ButtonHelper(this.buttons.btn_scroll_down, "btn_scroll_down", "btn_scroll_down", "btn_scroll_down_pressed");
		}
	}
	

	
	p.unlockOKButton = function() {
		if (!this.buttons.btn_ok.unlocked) {
			this.buttons.btn_ok.unlocked = true;
			this.buttons.btn_ok.helper = new createjs.ButtonHelper(this.buttons.btn_ok, 'btn_ok', 'btn_ok', 'btn_ok_pressed');
			this.buttons.btn_ok.addEventListener("click", function(event){
				this.persistLook()
				console.log("DressingRoom (", this, "): dispatching done event");
				this.dispatchEvent({type:"done", data:{avatar:this.look, nickname:this.nickname}});
			}.bind(this));
		}
	}
	
	p.incrementHairstyle = function() {
		if (this.look.hairstyle===undefined) this.look.hairstyle = 0;
		else this.look.hairstyle = (this.look.hairstyle + 1) % config.number.of.hairstyle;
		this.showHair();
		this.setFeature('hairstyle', this.look.hairstyle);
	}	
	p.decrementHairstyle = function() {
		if (this.look.hairstyle===undefined) this.look.hairstyle = 0;
		else this.look.hairstyle = this.look.hairstyle - 1;
		if (this.look.hairstyle < 0) this.look.hairstyle = config.number.of.hairstyle - 1;
		this.showHair();
		this.setFeature('hairstyle', this.look.hairstyle);
	}
	
	p.addonsListClick = function(item) {
		//console.log(item);
		if (item.feature=='uniform') this.look.uniform = item.value;
		else if (item.feature=='addon') {
			if (item.selected) {
				// remove item from addons list
				this.look.addons = _.difference(this.look.addons, [item.id]);
			}
			else {
				// add item to list
				if (!this.look.addons) this.look.addons = [];
				this.look.addons.push(item.id);
			}
		}
		this.avatar.setLook(this.look);
		this.showAddonsList();
	}
	
	

	// figure out where UI elements go
	p.buttonPos = function(feature, value) {
		if (value===undefined) value = this.look[value] || 0;
		switch(feature) {
			case 'skincolor': 	return new createjs.Rectangle(19+25*value, 179, 22, 27);
			case 'face': 		return new createjs.Rectangle(23 + 37*(value%4), 63 + 49*Math.floor(value/4), 28, 28);
			case 'haircolor': 	return new createjs.Rectangle(191 + 26*(value%2), 113 + 25*Math.floor(value/2), 22, 21);
		}
		return undefined;
	}
	

	p.prepareAssets = function() {
		this.assets = {};
		_.each(['dressing_behind', 'dressing_frame', 'dressing_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}


	sf.DressingRoom = DressingRoom;

}())
