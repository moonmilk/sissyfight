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
		
		this.prepareAssets();
		
		// backdrop layer: white bg for face previews, blue bg for mirror
		this.addChild(this.assets.dressing_behind);
		
		// layer for face previews
		this.faces = new createjs.Container();
		this.addChild(this.faces);
		
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
		var rect = this.skincolorPos();
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
		this.avatar.setLook(this.look, undressed);
		
		if (feature==='skincolor') {
			this.showFaces();
			var destX = this.skincolorPos().x;
			var slide = createjs.Tween
				.get(this.assets.dressing_ptr_skincolor)
				.to({x:this.skincolorPos().x}, 100+2*Math.abs(destX - this.assets.dressing_ptr_skincolor.x), createjs.Ease.quadOut)
				.addEventListener('change', function(e) {g.stage.update()});
		}
		
		g.stage.update();
	}
	
	
	p.showFaces = function() {
		// empty out any previous faces
		this.faces.removeAllChildren();
		for (var f=0; f<config.number.of.faces; f++) {
			var face = sf.Avatar.getFaceExemplarSprite(f, this.look.skincolor||0);
			face.x = 34 + 37 * (f % 4);
			face.y = 34 + 49 * (Math.floor(f/4));
			this.faces.addChild(face);
		}
	}
	
	p.prepareButtons = function() {
		// skin color swatches
		var room = this; // for binding in event handlers
		for (var i=0; i<config.number.of.skincolors; i++) {
			// make invisible hit areas, technique from http://community.createjs.com/discussions/easeljs/626-invisible-button
			var rect = this.skincolorPos(i);
			var hit = new createjs.Shape();
			hit.graphics.beginFill('#ffffff').drawRect(rect.x,rect.y,rect.width,rect.height);
			var box = new createjs.Shape();
			box.hitArea = hit;
			this.touch.addChild(box);
			box.info = {feature:'skincolor', value:i};
			box.addEventListener("click",function(event){room.setFeature(event.target.info.feature, event.target.info.value)});
		}
		
		
	}

	// figure out where UI elements go
	p.skincolorPos = function(skincolor) {
		if (skincolor===undefined) skincolor = this.look.skincolor || 0;
		//return 10 + 25 * (skincolor ? skincolor : 0);
		return new createjs.Rectangle(19+25*skincolor, 179, 22, 27);
	}

	p.prepareAssets = function() {
		this.assets = {};
		_.each(['dressing_behind', 'dressing_frame', 'dressing_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}


	sf.DressingRoom = DressingRoom;

}())
