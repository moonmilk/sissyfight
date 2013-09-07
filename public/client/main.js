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
	g.load.preloadBG = new createjs.Bitmap(g.load.prepreloader.getResult('preload_bg'));
	g.stage.addChild(g.load.preloadBG);

	g.load.progressbar = new createjs.Shape();
	g.stage.addChild(g.load.progressbar);
	g.load.progressbar.x = 244;
	g.load.progressbar.y = 44;
	
	g.load.preloader = new createjs.LoadQueue();//false);
	g.load.preloader.addEventListener("complete", loaded);
	g.load.preloader.addEventListener("progress", function(e){
		// placeholder progress bar
		g.load.progressbar.graphics.ss(0).f('#ffa').r(0,0,171*(e.loaded),7).ef();
		g.stage.update();
	});
	g.load.preloader.loadManifest(config.manifest, false, config.assetPath);
	g.load.preloader.loadManifest(sf.Avatar.makeAddonManifest(), false, config.assetPath);
	g.load.preloader.load();
}


function loaded() {
	// ####TODO: prepareSpritesheets can be slow, add a callback for the progress bar
	sf.Avatar.prepareSpritesheets();
	sf.DressingRoom.prepareAssets();
	
	// maybe socket connection should be tracked in progress bar too?  
	g.comm = new sf.Comm(g.sockjs, g.auth);
	comm.addEventListener('login', loginEstablished);
	
}
	
function loginEstablished(event) {
	g.stage.removeChild(g.load.progressbar);	
	g.stage.removeChild(g.load.preloadBG);
	
	if (event.data.error) {
		// TODO: what to do?
		console.log("Login trouble! " + event.data.error)
	}
	else {
		g.dressing.room = new sf.DressingRoom(event.data.avatar);
		g.stage.addChild(g.dressing.room);
	}

	g.stage.update();
	
	
}
	


