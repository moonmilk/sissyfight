/*
	avatar layers according to Terry:
	
	0 = background
	1 = behind everything 
	2 = face sprite 
	3 = above face / below hair e.g. glasses 
	4 = hairs and hats 
	5 = above hair e.g. hair bow, front of head arrow 
	6 = nude bods 
	7 = uniforms and costumes 
	8 = handwear e.g. boxing gloves 
	9 = in front of everything
	
	facial expressions:
	0 neutral
	1 smile
	2 argh
	3 sad		terry/cindy:
	4 look    - talking
	5 talking - blink
	6 blink   - look
	
	full body poses:
	0 neutral
	1 sit & cry
	2 victory
	upper body poses (polaroids only):
	3 lick lolly
	4 cower
	5 tease
	6 scratch
	7 tattle
	8 grab

*/

// namespace:
this.sf = this.sf||{};

(function() {

var Avatar = function(masterlayers, offset) {
  this.initialize(masterlayers, offset);
}
var p = Avatar.prototype = new createjs.Container();

	//p.info = null;
	
	p.NUM_LAYERS = config.avatar.numAvatarLayers;
	//p.layers = [];
		
	p.NUM_POSES = config.avatar.numPoses;
	
	//p.look = {};
	//p.offset = {x:0, y:0};

	p.Container_initialize = p.initialize;
	
	
	// initialize: 
	//		optional masterLayers is list of layers to use, so that multiple avatars can be interleaved
	//		optional offset is {x:xoffset, y:yoffset} to apply to all subsprites. -- useful when using masterLayers so you can't just set x, y of avatar itself.
	
	p.initialize = function(masterLayers, offset) {
		this.Container_initialize();
		
		this.info = null;
		this.look = {};
		this.offset = {x:0, y:0};
		
		this.testID = Math.random();
		
		if (offset) this.offset = offset;	
		
		this.layers = [];
		for (var l=0; l<this.NUM_LAYERS; l++) {	
			this.layers[l] = new createjs.Container();
			this.layers[l].info = "Avatar " + this.testID + " layer " + l + " container."
			if (masterLayers && masterLayers.length==this.NUM_LAYERS) {
				masterLayers[l].addChild(this.layers[l]);
			}
			else {				
				this.addChild(this.layers[l]);
			}
			this.layers[l].x = this.offset.x;
			this.layers[l].y = this.offset.y;
		}
		
		this.prepareAssets();
		
		//this.clear();
	}
	
	p.clear = function() {
		this.look = _.cloneDeep(this.look);
		_.defaults(this.look, {remove_background:false, name:"{NO NAME}", face:0,skincolor:0,expression:0,hairstyle:0,haircolor:0,pose:0,bodydir:0,headdir:0,uniform:0,uniformcolor:0, addons:[], overlays:[]});
		if (this.sprites) _.each(this.sprites, function(sprite){ if (sprite.parent) sprite.parent.removeChild(sprite)});
		if (this.addonSprites) _.each(this.addonSprites, function(sprite){ if (sprite.parent) sprite.parent.removeChild(sprite)});
		
		this.sprites = {face:null, hair:null, body:null, uniform:null};
		this.addonSprites = [];
		
		//console.log(this.layers)
		//_(this.layers).each(function(layer){layer.removeAllChildren();});
		_(this.layers).invoke('removeAllChildren');
	}
	
	//p.setLook = function(face, skincolor, hairstyle, haircolor, uniform, uniformcolor, addons) {
	p.setLook = function(look, dressingRoom) {	
		this.clear();
		
		_.assign(this.look, look);
		
		// special case for addon 402, MadBetty's grayscale, which should always be one more than the highest regular color number
		if (this.look.addons.indexOf(402) != -1) {
			this.look.skincolor = config.number.of.skincolor;
			this.look.haircolor = config.number.of.haircolor;
			this.look.uniformcolor = config.number.of.uniformcolor;
		}
		
		this.sprites.face = new createjs.Sprite(sf.Avatar.sheet.faces[this.look.skincolor]);
		this.sprites.face.scaleX = -1;
		this.layers[2].addChild(this.sprites.face);
		
		this.sprites['info'] = "face";
			
		this.setFace(this.look.face);
		

		this.sprites.hair = new createjs.Sprite(sf.Avatar.sheet.hairs[this.look.haircolor]);
		this.sprites.hair.scaleX = -1;		
		this.layers[4].addChild(this.sprites.hair);
		
		this.sprites['info'] = "hair";
		
		this.sprites.hair.gotoAndStop(this.look.hairstyle); 
		
		
		
		this.sprites.body = new createjs.Sprite(sf.Avatar.sheet.bodies[this.look.skincolor]);
		this.layers[6].addChild(this.sprites.body);
	
		//this.sprites.body.gotoAndStop(this.look.pose); // NO, done in applyPose
		
		

		this.sprites.uniform = new createjs.Sprite(sf.Avatar.sheet.uniforms[this.look.uniformcolor]);
		this.sprites.uniform.scaleX = 1;
		this.layers[7].addChild(this.sprites.uniform);
	
		//this.sprites.uniform.gotoAndStop(this.look.pose + config.avatar.numPoses * this.look.uniform);  // NO, done in applyPose
		


		this.applyDir();
		this.applyPose();
		
		// for dressing room, if face and hairstyle aren't set yet, use the mudmask (1) and towel (2) addons
		var dressingRoomAddons = [];
		if (dressingRoom && dressingRoom.faceless) dressingRoomAddons.push(1);
		if (dressingRoom && dressingRoom.hairless) dressingRoomAddons.push(2);
		
		var useAddons = (dressingRoomAddons.length > 0) ? dressingRoomAddons : this.look.addons;
		
		_.forEach(useAddons, function(addonID) {
			var sprites = Avatar.getAddonSprites(addonID, this.look); // this.look.pose, this.look.dir, this.look.skincolor);
			_.forEach(sprites,  function(spriteInfo) {
				// get rid of default avatar sprites that conflict with addon sprites, but don't get rid of sprites belonging to other addons
				// (addon sprites have the addon property)
				//this.layers[spriteInfo.layer].removeAllChildren();
				_(this.layers[spriteInfo.layer].children).where({addon:undefined}).map(function(sprite){sprite.parent.removeChild(sprite)});
				if (spriteInfo.sprite) {
					this.layers[spriteInfo.layer].addChild(spriteInfo.sprite); // there can also be override layers where sprite is null but you should still clear this layer 
					this.addonSprites.push(spriteInfo.sprite);
				}
			}, this);
		}, this);
		
		this.applyOverlays();
		
		// add damage display if it's in the look
		if (this.look.damage) {
			var damageDisplay, damageDisplayShadow;
			if (this.look.damage > 0) {
				damageDisplay = new createjs.Text("-" + this.look.damage, config.getFont('polaroidDamage'), '#ff9988');
				damageDisplayShadow = new createjs.Text("-" + this.look.damage, config.getFont('polaroidDamage'), '#333333');
			}
			else {
				damageDisplay = new createjs.Text("+"+(0-this.look.damage), config.getFont('polaroidDamage'), '#55ff55');
				damageDisplayShadow = new createjs.Text("+"+(0-this.look.damage), config.getFont('polaroidDamage'), '#333333');
			}
			damageDisplay.x = -7;
			damageDisplay.y = -15;
			damageDisplayShadow.x = -5;
			damageDisplayShadow.y = -13;
			this.layers[9].addChild(damageDisplayShadow);
			this.layers[9].addChild(damageDisplay);
		}
	}
	
	
	p.setExpression = function(expression) {
		this.look.expression = expression;
		this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + expression)
	}
	
	
	
	p.setFace = function(face) {
		this.look.face = face;
		this.sprites.face.gotoAndStop(config.avatar.numExpressions * face + this.look.expression);
	}
	
	
	p.setPose = function(pose) {
		this.look.pose = pose;
		this.applyPose();
	}
	
	p.applyPose = function () {
		//console.log("setPose", pose, this.look, pose + config.avatar.numPoses*this.look.dir, config.avatar.numPoses *this.look.uniform);
		this.sprites.body.gotoAndStop(this.look.pose + config.avatar.numPoses*this.look.bodydir);
		this.sprites.uniform.gotoAndStop(this.look.pose + config.avatar.numPoses *this.look.uniform);
		if (this.look.pose==1) {
			this.sprites.face.y = config.avatar.cryOffset;
			this.sprites.hair.y = config.avatar.cryOffset;
		}
		else {
			this.sprites.face.y = 0;
			this.sprites.hair.y = 0;
		}
	}
	

	
	p.applyDir = function() {
		if (this.look.headdir) {
			this.sprites.face.scaleX = 1;
			this.sprites.hair.scaleX = 1;
			// compensate for mirror problem
			this.sprites.face.x = -1;
			this.sprites.hair.x = -1;
		} 
		else {
			this.sprites.face.scaleX = -1;
			this.sprites.hair.scaleX = -1;
			// compensate for mirror problem
			this.sprites.face.x = 0;
			this.sprites.hair.x = 0;
		}
		
		if (this.look.bodydir) {		
			this.sprites.body.gotoAndStop(this.look.pose + config.avatar.numPoses);
			this.sprites.uniform.scaleX = -1;
			// compensate for mirror problem
			this.sprites.uniform.x = -1;
		}
		else {
			this.sprites.body.gotoAndStop(this.look.pose);
			this.sprites.uniform.scaleX = 1;
			// compensate for mirror problem
			this.sprites.uniform.x = 0;
		}
		//console.log("setDir", dir, this.look);
	}
	
	
	
	p.applyOverlays = function() {
		if (!this.look.overlays) return;
		_.forEach(this.look.overlays, function(overlay) {
			var overlaySprite = this.overlayAssets[overlay].clone();
			overlaySprite.info = "avatar overlay " + overlay;
			this.layers[config.avatar.overlayLayer].addChild(overlaySprite);
			// handle left-right flip
			// have to treat holdlolly differently because it's a body overlay and the rest are head overlays
			var dir;
			if (overlay=='ovl_holdlolly') {
				dir = this.look.bodydir;
			}
			else {
				dir = this.look.headdir;	
				// check for crying (crouched on ground)
				if (this.look.pose==Avatar.poses.HUMILIATED) {
					overlaySprite.y = config.avatar.cryOffset; 
				}
			}
			if (dir) {
				overlaySprite.scaleX = -1;
				overlaySprite.x = -1;
			}
			else {
				overlaySprite.scaleX = 1;
				overlaySprite.x = 0;
			}
			
			//console.log('Avatar.applyOverlays: applying ' + overlay + ' as sprite', overlaySprite);
			
		}, this);
	}

	
	
	
	p.setUniform = function(uniform) {
		this.look.uniform = uniform;
		this.sprites.uniform.gotoAndStop(this.look.pose + config.avatar.numPoses * uniform);
	}
	
	
	
	// face animations
	
	// setBlink(true) to close eyes
	p.setBlink = function(flag) {
		if (flag && this.look.expression == sf.Avatar.expressions.NEUTRAL) {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + sf.Avatar.expressions.BLINK);
		}
		else {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + this.look.expression);
		}
	}
		
	// setGlance(true) to look the other direction
	p.setGlance = function(flag) {
		if (flag && this.look.expression == sf.Avatar.expressions.NEUTRAL) {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + sf.Avatar.expressions.LOOK);
		}
		else {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + this.look.expression);
		}		
	}

	// setTalk(true) to open mouth
	p.setTalk = function(flag) {
		if (flag) {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + sf.Avatar.expressions.TALK);
		}
		else {
			this.sprites.face.gotoAndStop(config.avatar.numExpressions * this.look.face + this.look.expression);
		}
	}

	
	

	p.prepareAssets = function() {
		this.overlayAssets = {};
		_.each(['overlays'], function(s) {
			g.load.unpack(s, this.overlayAssets);
		}, this);
	}
	




	// "static" stuff
	// "constants" to match the expression and pose terms used in the old sissyfight code
	Avatar.expressions = {
		'NEUTRAL' 	: 0,
		'CONTENT' 	: 1,
		'PAINED'	: 2,
		'SAD'		: 3,
		'LOOK'		: 4,
		'TALK'		: 5,
		'BLINK'		: 6
	}
	Avatar.poses = {
		'NEUTRAL'	: 0,
		'HUMILIATED' : 1,
		'VICTORY'	: 2,
		'LICKING'	: 3,
		'COWERING'	: 4,
		'TEASING'	: 5,
		'SCRATCHING'  : 6,
		'TATTLING'	: 7,
		'GRABBING'	: 8
	}
	Avatar.directions = {
		'LEFT' 		: 0,
		'RIGHT'		: 1
	}
	Avatar.overlays = {
		'SCRATCH'	: 'ovl_scratch',
		'LICK'		: 'ovl_lick',
		'HOLDLOLLY'	: 'ovl_holdlolly',
		'CHOKE'		: 'ovl_choke',
		'TEARS'		: 'ovl_tears'
	}
	
	// make up a random look for testing
	Avatar.randomLook = function() {
		var look = {};
		look.face = Math.floor(Math.random() * config.number.of.face);
		look.skincolor = Math.floor(Math.random() * config.number.of.skincolor);
		look.hairstyle = Math.floor(Math.random() * config.number.of.hairstyle);
		look.haircolor = Math.floor(Math.random() * config.number.of.haircolor);
		look.uniform = Math.floor(Math.random() * config.number.of.uniform);
		
		return look;
	}
	
	// make a sprite with a particular face and skin color for the dressing room
	Avatar.getFaceExemplarSprite = function(face, skincolor) {
		var sprite = new createjs.Sprite(sf.Avatar.sheet.faces[skincolor]);
		sprite.gotoAndStop(config.avatar.numExpressions * face + Avatar.expressions.NEUTRAL);
		return sprite;
	}
	
	// make a sprite with a particular hairstyle and hair color for the dressing room
	Avatar.getHairExemplarSprite = function(hairstyle, haircolor) {
		var sprite = new createjs.Sprite(sf.Avatar.sheet.hairs[haircolor]);
		// sprite.scaleX = -1;		
		sprite.gotoAndStop(hairstyle); 
		return sprite;
	}
	
	
	
	sf.Avatar = Avatar;
	
	

}())