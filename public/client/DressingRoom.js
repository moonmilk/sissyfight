// DressingRoom extends Container

// namespace:
this.sf = this.sf||{};

(function() {

var DressingRoom = function(look) {
  this.initialize(look);
}

var p = DressingRoom.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(look) {
		this.Container_initialize();	
		this.look = look;
		
		// set up random defaults if this is a new character
		if (this.look.skincolor === undefined) this.look.skincolor = Math.floor(Math.random()*config.number.of.skincolor);
		if (this.look.haircolor === undefined) this.look.haircolor = Math.floor(Math.random()*config.number.of.haircolor);
		
		
		this.prepareAssets();
		
		// backdrop layer: white bg for face previews, blue bg for mirror
		this.addChild(this.assets.dressing_behind);
		
		// layer for face previews
		this.faces = new createjs.Container();
		this.addChild(this.faces);
		this.showFaces();
		
		// avatar in mirror
		this.avatar = new sf.Avatar();
		this.look.headdir = this.look.bodydir = 0; // face left
		
		//   signal to Avatar if face and hair are not yet defined
		var undressed = {};
		if (this.look.face === undefined) undressed.faceless = true;
		if (this.look.hairstyle === undefined) undressed.hairless = true;
		this.avatar.setLook(this.look, undressed);
		
		this.avatar.x = 460;
		this.avatar.y = 55;
		this.addChild(this.avatar);

		// framing layer
		this.addChild(this.assets.dressing_frame);
		
		// UI elements
		this.addChild(this.assets.dressing_ptr_skincolor);
		var rect = this.buttonPos('skincolor');
		this.assets.dressing_ptr_skincolor.x = rect.x;
		this.assets.dressing_ptr_skincolor.y = rect.y;
		
		// touch areas
		this.touch = new createjs.Container()
		this.addChild(this.touch);
		
		this.prepareButtons();
		
	}
	
	

	
	
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
		
		if (feature==='skincolor') {
			this.showFaces();
			var destX = this.buttonPos('skincolor', value).x;
			var slide = createjs.Tween
				.get(this.assets.dressing_ptr_skincolor)
				.to({x:destX}, 100+2*Math.abs(destX - this.assets.dressing_ptr_skincolor.x), createjs.Ease.quadOut)
				.addEventListener('change', function(e) {g.stage.update()}); //TODO: don't call update from tweens! Maybe switch to framerate-based updates
		}
		
		g.stage.update();
	}
	
	
	p.showFaces = function() {
		// empty out any previous faces
		this.faces.removeAllChildren();
		for (var f=0; f<config.number.of.face; f++) {
			var face = sf.Avatar.getFaceExemplarSprite(f, this.look.skincolor||0);
			var rect = this.buttonPos('face',f);
			face.x = rect.x + 11; // 34 + 37 * (f % 4);
			face.y = rect.y - 29; // 34 + 49 * (Math.floor(f/4));
			this.faces.addChild(face);
		}
	}
	
	p.prepareButtons = function() {
		var room = this; // for binding in event handlers
		
		_.each(['skincolor', 'face'],function(feature) {
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
	}

	// figure out where UI elements go
	p.buttonPos = function(feature, value) {
		if (value===undefined) value = this.look[value] || 0;
		switch(feature) {
			case 'skincolor': 	return new createjs.Rectangle(19+25*value, 179, 22, 27);
			case 'face': 		return new createjs.Rectangle(23 + 37*(value%4), 63 + 49*Math.floor(value/4), 28, 28);
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
