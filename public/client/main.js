/*
	sissyfight startup!
*/

// alias for future name change
createjs.Sprite = createjs.BitmapAnimation;

// one big global variable to keep useful stuff in
var g = {load:{}, dressing:{}, homeroom:{}, game:{}};

function start(sockjs, auth) {
	g.sockjs = sockjs;
	g.auth = auth;
	
	g.stage = new createjs.Stage("appCanvas");
	g.stage.enableMouseOver();
	
	// set up tick-based update
	g.stage.maybeUpdate = function() { }; // can alias this to g.stage.update if i decide to switch back to on-demand updates
	createjs.Ticker.addEventListener('tick', function(event) {
		g.stage.update();
	});
	
	// set up prepreloader to load the loading screen
	g.load.prepreloader = new createjs.LoadQueue();
	g.load.prepreloader.addEventListener("complete", loadStage2);
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
function loadStage2() {	
	// loading screen and progress bar
	g.load.progressbar = new createjs.Shape();
	g.stage.addChild(g.load.progressbar);
	g.load.progressbar.x = 244;
	g.load.progressbar.y = 44;
	
	g.load.preloadBG = new createjs.Bitmap(g.load.prepreloader.getResult('preload_bg'));
	g.stage.addChild(g.load.preloadBG);
	
	// tapping fingers
	var tapsheet = g.load.prepreloader.getItem('preload_tapping').data.sheet;
	tapsheet.images = [g.load.prepreloader.getResult('preload_tapping')]; 
	g.load.tapping = new createjs.Sprite(new createjs.SpriteSheet(tapsheet));
	g.stage.addChild(g.load.tapping);
	g.load.tapping.x = 472;
	g.load.tapping.y = 222;
	g.load.tapping.gotoAndPlay('tap');
	

	
	g.load.preloader = new createjs.LoadQueue();//false);
	g.load.preloader.addEventListener("complete", loaded);
	g.load.preloader.addEventListener("progress", function(e){
		// placeholder progress bar
		g.load.progressbar.graphics
			.f('#99a').r(0,0,171,7).ef()
			.f('#ffa').r(0,0,171*e.loaded,7).ef();
		//g.stage.maybeUpdate();
	});
	g.load.preloader.loadManifest(config.manifest, false, config.assetPath);
	g.load.preloader.loadManifest(sf.Avatar.makeAddonManifest(), false, config.assetPath);
	g.load.preloader.load();
}


function loaded() {
	// ####TODO: prepareSpritesheets can be slow, add a callback for the progress bar
	sf.Avatar.prepareSpritesheets();
	
	// maybe socket connection should be tracked in progress bar too?  
	g.comm = new sf.Comm(g.sockjs, g.auth);
	comm.addEventListener('login', loginEstablished);
	
}
	
function loginEstablished(event) {
	g.stage.removeChild(g.load.progressbar);	
	g.stage.removeChild(g.load.preloadBG);
	g.stage.removeChild(g.load.tapping);
	
	if (event.data.error) {
		// TODO: what to do?
		console.log("Login trouble! " + event.data.error)
	}
	else {
		g.dressing.room = new sf.DressingRoom(event.data.avatar, event.data.nickname);
		g.stage.addChild(g.dressing.room);
	}

	g.stage.maybeUpdate();
	
	
}
	


