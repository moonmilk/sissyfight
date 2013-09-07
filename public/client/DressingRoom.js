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
		
		// backdrop layer: white bg for face previews, blue bg for mirror
		this.addChild(DressingRoom.assets.dressing_behind);
		
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
		this.addChild(DressingRoom.assets.dressing_frame);
		
		// UI elements
		this.addChild(DressingRoom.assets.dressing_ptr_skincolor);
		DressingRoom.assets.dressing_ptr_skincolor.x = this.skinPtrX();
		DressingRoom.assets.dressing_ptr_skincolor.y = 167;
		
	}
	
	
	// figure out where UI pointers go
	p.skinPtrX = function() {
		return 10 + 25 * (this.look.skincolor ? this.look.skincolor : 0);
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
			//DressingRoom.assets.dressing_ptr_skincolor.x = this.skinPtrX();
			this.showFaces();
			var slide = createjs.Tween
				.get(DressingRoom.assets.dressing_ptr_skincolor)
				.to({x:this.skinPtrX()}, 200, createjs.Ease.quadOut)
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


	// 'static' methods
	DressingRoom.prepareAssets = function() {
		DressingRoom.assets = {};
		//DressingRoom.assets.behind = new createjs.Bitmap(g.load.preloader.getResult('dressing_behind'));
		//DressingRoom.assets.frame = new createjs.Bitmap(g.load.preloader.getResult('dressing_frame'));
		_.each(['dressing_behind', 'dressing_frame', 'dressing_items'], function(s) {
			g.load.unpack(s, DressingRoom.assets);
		});
	}


	sf.DressingRoom = DressingRoom;

}())
