// Loader extends Container

// namespace:
this.sf = this.sf||{};


(function() {
var Loader = function() {
	this.initialize();
}
var p = Loader.prototype = new createjs.Container();
	p.Container_initialize = p.initialize;
	
	p.initialize = function() {
		this.Container_initialize();
	}

	p.start = function(school) {
		// school arg's not used yet but will probably be used in future to choose alternate assets to load
		
		// set up prepreloader to load the loading screen
		g.load.prepreloader = new createjs.LoadQueue();
		g.load.prepreloader.addEventListener("complete", this.loadStage2.bind(this));
		g.load.prepreloader.loadManifest(config.preloadManifest, true, config.assetPath);
		
		// function to import single or collage-packed assets from loader id images into destination object
		g.load.unpack = function(id, destination) {
			var image = g.load.preloader.getResult(id);
			var item  = g.load.preloader.getItem(id);	
			if (!image) return;
			if (item.data && item.data.pieces) {
				// collage-packed item with spritesheet-format frames - chop it up into individual Sprites
				var sheet = {images:[image], frames:[], animations:{}};
				var n=0;
				_.forOwn(item.data.pieces,function(frameInfo, frameId) {
					sheet.frames.push(frameInfo);
					sheet.animations[frameId] = {frames:[n]};
					++n;
				});
				var spritesheet = new createjs.SpriteSheet(sheet);
				_.forOwn(item.data.pieces,function(frameInfo, frameId) {
					destination[frameId] = new createjs.Sprite(spritesheet);
					destination[frameId].gotoAndStop(frameId);
				})
			}
			else {
				// single item can be a single Bitmap
				destination[id] = new createjs.Bitmap(image);
				if (item.data && item.data.regX) destination[id].regX = item.data.regX;
				if (item.data && item.data.regY) destination[id].regY = item.data.regY;
			}
		}
	}

	
	// pre-preload is done
	p.loadStage2 = function () {	
		g.load.prepreloader.removeAllEventListeners();
		
		// loading screen and progress bar
		g.load.progressbar = new createjs.Shape();
		this.addChild(g.load.progressbar);
		g.load.progressbar.x = 244;
		g.load.progressbar.y = 44;
		
		g.load.preloadBG = new createjs.Bitmap(g.load.prepreloader.getResult('preload_bg'));
		this.addChild(g.load.preloadBG);
		
		// tapping fingers
		var tapsheet = g.load.prepreloader.getItem('preload_tapping').data.sheet;
		tapsheet.images = [g.load.prepreloader.getResult('preload_tapping')]; 
		g.load.tapping = new createjs.Sprite(new createjs.SpriteSheet(tapsheet));
		this.addChild(g.load.tapping);
		g.load.tapping.x = 472;
		g.load.tapping.y = 222;
		g.load.tapping.gotoAndPlay('tap');
		
	
		// get rid of the prepre.
		delete g.load['prepreloader'];
			
		g.load.preloader = new createjs.LoadQueue();//false);
		g.load.preloader.addEventListener("complete", this.loaded.bind(this));
		g.load.preloader.addEventListener("progress", function(e){
			g.load.progressbar.graphics
				.f('#99a').r(0,0,171,7).ef()
				.f('#ffa').r(0,0,171*e.loaded,7).ef();
		}).bind(this);
		g.load.preloader.loadManifest(config.manifest, false, config.assetPath);
		g.load.preloader.loadManifest(sf.Avatar.makeAddonManifest(), false, config.assetPath);
		g.load.preloader.load();
	}
	
	
	p.loaded = function () {
		// ####TODO: prepareSpritesheets can be slow, add a callback for the progress bar
		sf.Avatar.prepareSpritesheets();
		this.dispatchEvent('loaded');		
	}

	
	
	

	sf.Loader = Loader;

})();

