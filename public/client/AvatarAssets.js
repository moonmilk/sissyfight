// Avatar addon loaders and helpers




/*
	avatar description

	hairstyle  ----,--> hair layer 4 (overridden by layer 4 items)
	haircolor  ---/
	face       -----,--> face layer 2 (layer 2, no overrides exist)
	skincolor  ----/--> body layer	 6 (layer 6, no overrides exist)
	uniformstyle  ---,----> uniform layer 7 (has overrides)
	uniformcolor  --/   (chosen by game room)

	up to two(?) addons, which may cause hair or uniform not to be displayed if there's layer conflict, but don't erase them from avatar description
	addons probably will be checked for layer conflicts?





	avatar addon item description
	
	id:
	[name]
	file: list of filename or names of assets (unflipped, flipped) - assume .png if not specified
	poses per layer: 1 (never changes), 2 (changes only for crying pose), or 9 (changes for every pose)
	offset: in asset <-- DEFAULTS TO 0, use only after combining multiple addons into single asset
	layers: list of n layer sprites
	conflicts: dict: for each layer (whether or not there's a sprite in it), list of zone letters.  Can't coexist with other addons in same layer and same zone.
	override: undefined, or list of default layers that should be hidden when this addon is displayed (eg hide uniform layer for full body costume even if addon doesn't have art in uniform layer)
	width, height, regx, regy per sprite (maybe inherited from spritesheet)
	flippable: 0, 1, 2 - 0 assumes that the next n sprites are the pre-flipped versions; 1 use negative scale to flip; 2 don't flip at all
	// sheetID: name of destination spritesheet <-- NO, all addons can just go on one spritesheet per addon, or per asset if there's multiple addons in one png
	colorset: unset if no color variations, or name of color set e.g. 'skin'
	colorize: boolean - true if color variations should be generated in client - better keep colorizable addons in separate assets from others!
	
	computed items -
	sheet: pointer to loaded spritesheet object
	frame: pointer to first frame in spritesheet
	
*/
/*

addons = [
	// simple example: 2 poses, 1 layer, flippable
	{id:		101,
	name:		"piano tie",
	poses:		2,
	layers:		[8],
	conflicts:  {8:["B"]},
	flippable:	1,
	files:		['101']
	},
	
	// 9 poses, 1 layer, not flippable
	{id:		110,
	name:		"red arm ribbon",
	poses:		9,
	layers:		[8],
	conflicts:	{8:["B"]},
	flippable: 	0,
	files:		['110-L', '110-R']	
	},
	
	// 2 poses, 2 layers, not flippable
	{id:		201,
	name:		"head arrow",
	poses:		2,									// iterate poses fastest, then layers
	layers:		[1, 5],
	conflicts:	{1:["H"], 5:["H"]},
	flippable:	0,
	files:		['201-L1','201-L5','201-R1','201-R5'], // flipping is always the last iteration.
	colorset:	null								// ... unless there's color variations, then THOSE are outermost iteration.
	},
	
	
	// colorize example
	{id:		211,
	name:		'elf ear',
	poses:		2,
	layers:		[5],
	conflicts:	{5:["E"]},
	flippable:	1,
	files:		['211'],
	colorset:	'skin',
	colorize:	1
	},
	
	
	{id:		318,
	name:		'fairy',
	poses:		9,
	layers: 	[1,7],
	conflicts:	{1:['B'], 7:['BL']},
	flippable:	1,
	files:		['318-1', '318-9'],
	colorset: null,
	colorize: 0
	}
	
	
	
];
*/

sf.Avatar.prepareSpritesheets = function() {
	sf.Avatar.sheet = {};
	sf.Avatar.sheet['faces'] = sf.Avatar.makeColoredSpritesheets('faces');
	sf.Avatar.sheet['hairs'] = sf.Avatar.makeColoredSpritesheets('hairs');
	sf.Avatar.sheet['bodies'] = sf.Avatar.makeColoredSpritesheets('bodies');
	sf.Avatar.sheet['uniforms'] = sf.Avatar.makeColoredSpritesheets('uniforms');
	
	sf.Avatar.makeAddonSpritesheets();			
}


sf.Avatar.makeColoredSpritesheets = function (assetID) {
	sheets = [];
	
	var image = g.load.preloader.getResult(assetID);
	var itemInfo = g.load.preloader.getItem(assetID);	
	var itemData = itemInfo.data;

	//image['loadInfo'] = itemInfo;		
	//console.log(itemInfo);
	
	// does the asset get colorized?
	if (itemData && itemData.colors) {
		var colors = config.colors[itemData.colors];
		
		for (var i=0; i < colors.vars.length; i++) {
			var img = new createjs.Bitmap(image);
			if (colors.vars[i]=='grayscale') { // special case for MadBetty's custom avatar - thanks for your support!
				var gray = new createjs.ColorMatrix().adjustSaturation(-100);
				img.filters = [new createjs.ColorMatrixFilter(gray)];
			}
			else {
				img.filters = [new sf.ColorSubstitutionFilter(colors.vars[colors.base], colors.vars[i])];
			}
			img.cache(0, 0, img.image.width, img.image.height);
			
			sheets[i] = new createjs.SpriteSheet({
				images:	[img.cacheCanvas],
				frames:	{width:itemData.grid[0], height:itemData.grid[1], regX:itemData.reg[0], regY:itemData.reg[1]}
			});
			sheets[i]['info'] = "spritesheet from " + itemInfo.src + " colorized";
		}
	}
	// not colorized
	else if (itemData) {
		sheets[0] = new createjs.SpriteSheet({
			images: [image],
			frames:	{width:itemData.grid[0], height:itemData.grid[1], regX:itemData.reg[0], regY:itemData.reg[1]}
		})
		sheets[0]['info'] = "spritesheet from " + itemInfo.src;
	}
	else console.log('asset has no manifest data for spritesheet', assetID);
	
	return sheets;
}


sf.Avatar.makeAddonManifest = function() {
	var manifest = [];
	//var files = {};
	
	//for (var i=0; i<addons.length; i++) {
	//	var item = addons[i];
	_.forEach(config.addons, function(item) {
		//for (var f=0; f<item.files.length; f++) {
			//var filename = item.files[f]
		_.forEach(item.files, function(filename) {
			var id = "addons." + filename;
			// already seen this file?
			//if (!files[filename]) {
			//	files[filename] = 1;
			if (!_.find(manifest, {id: id})) {
				manifest.push({
					id: "addons." + filename,
					src: "avatar/" + filename + ".png"
				});
			}
			
		});
		
	});
	return manifest;
}

sf.Avatar.makeAddonSpritesheets = function() {
	_.forEach(config.addons, function(item) {
		var images = [];
		_.forEach(item.files, function(filename) {	
			var image = g.load.preloader.getResult("addons." + filename);
			if (!image) console.log("Couldn't load addon file " + filename); // ####
			else images.push(image);
		});
		// does it need colorizing?
		if (item['colorize'] && item['colorset']) {
			var colorized = [];
			var colors = config.colors[item.colorset];
			_.forEach(colors.vars, function(colorway) {
				_.forEach(images, function(image) {
					var img = new createjs.Bitmap(image);
					if (colorway=='grayscale') { // special case for MadBetty's custom avatar - thanks for your support!
						var gray = new createjs.ColorMatrix().adjustSaturation(-100);
						img.filters = [new createjs.ColorMatrixFilter(gray)];
					}
					else {
						img.filters = [new sf.ColorSubstitutionFilter(colors.vars[colors.base], colorway)];
					}
					img.cache(0, 0, img.image.width, img.image.height);
					colorized.push(img.cacheCanvas);
				});
			});
			// replace original set with colorized set
			images = colorized;
		}

		// inconsistent that main avatar images are stored in Avatar, but addon images are stored in config.addons
		// ... maybe fix it someday.
		if (images && images.length > 0) {
			item['sheet'] = new createjs.SpriteSheet({
				images: images,
				frames: config.avatar.addonsDims
			});
			item['sheet']["info"] = "spritesheet for addon " + item.id + " from " + _.pluck(images, 'src').join(", ");
		}
		else {
			// addon with no images might be used to signal a special case 
		}
	});
}


// check for conflict between 2 - returns true if they're all ok
sf.Avatar.checkCompatibility = function (id0, id1) {
	var items = _.map([id0, id1], function(id){return _.find(config.addons, {id:id})});
		
	// for each layer, check if conflict zones overlap
	for (var l=0; l<config.avatar.numAvatarLayers; l++) {
		// are there any intersections between the 2 conflict lists? (substitute empty list for layers that don't have conflict arrays)
		if (_.intersection(items[0].conflicts[l] || [], items[1].conflicts[l] || []).length > 0) return false;
	}
	return true;
}

// return list of ids of all addons that are not compatible with the given list of ids
sf.Avatar.listConflicts = function(myAddonIDs) {
	var conflicts = [];
	_(myAddonIDs).each(function(myAddonID) {
		_(config.addons).each(function(otherAddon){
			if (myAddonID != otherAddon.id) {
				if (!sf.Avatar.checkCompatibility(myAddonID, otherAddon.id)) {
					conflicts.push(otherAddon.id);
				}
			}
		}, this);
	}, this);
	return conflicts;
}


sf.Avatar.getAddonSprites = function (id, look) { // pose, direction, skincolor) {
	var item = _.find(config.addons, {id:id});
	if (!item) return undefined;
	
	var pose = look.pose;
	var skincolor = look.skincolor;
	
	var sprites = [];
	for (var layerIndex=0; layerIndex<item.layers.length; layerIndex++) {
		// choose head direction or body direction depending on layer zone
		var direction = look.bodydir;
		var layerNum = item.layers[layerIndex];
		if (item.conflicts && item.conflicts[layerNum]) {
			var zone = item.conflicts[layerNum];
			// check for Head, Face, or Ear zone
			if (zone.indexOf("H") != -1 || zone.indexOf("F") != -1 || zone.indexOf("E") != -1) {
				direction = look.headdir;
			}
		}
		
		var sprite = new createjs.Sprite(item.sheet);
		if (item.poses==1) pose = 0;
		else if (item.poses==2) pose = (pose==1 ? 1 : 0);
		var offset = item['offset'] ? item.offset : 0; // used if there's more than one addon in a single graphic
		
		// compute frame number
		//   dimensions are pose, layer, flip, color
		var poseExtent = item.poses;
		var layerExtent = item.layers.length;
		var flipExtent = (item.flippable==0) ? 2 : 1;
		var colorExtent = (item.colorset) ? item.colorset.length : 1;
		
		var frameNum = offset;
		frameNum += pose;
		frameNum += layerIndex * poseExtent;
		if (item.flippable==0) frameNum += direction * layerExtent * poseExtent;		
		if (item.colorset) frameNum += skincolor * flipExtent * layerExtent * poseExtent;
		
		
		//var frameNum = offset + pose + item.poses*layerIndex + (item.flippable==0 ? 0 : item.poses*item.layers.length*direction)
		//						+ (item.colorset ? ((item.flippable==0 ? 1 : 2) * item.poses * item.layers.length * direction) : 0);
		sprite.gotoAndStop(frameNum);
		
		// fix for mirror problem
		if (item.flippable == 1 && direction) {
			sprite.scaleX = -1;
			sprite.x = -1;
		}
		else {
			sprite.scaleX = 1;
			sprite.x = 0;
		}
		sprite['addon'] = true;
		sprite['info'] = "#"+item.id + " layer " + item.layers[layerIndex] + " sheet frame " + frameNum;
		sprites.push({layer:item.layers[layerIndex], sprite:sprite});
	}
	
	if (item.override) _.forEach(item.override, function(o){
		sprites.push({layer:o, sprite:null});
	});
	
	return sprites;
}

