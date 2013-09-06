/*
	sissyfight startup!
*/

// alias for future name change
createjs.Sprite = createjs.BitmapAnimation;

// one big global variable to keep useful stuff in
var g = {};

function start(sockjs, auth) {
	g.sockjs = sockjs;
	g.auth = auth;
	
	g.stage = new createjs.Stage("appCanvas");
	
	g.load = {};
	
	// set up prepreloader to load the loading screen
	g.load.prepreloader = new createjs.LoadQueue();
	g.load.prepreloader.addEventListener("complete", loadStage2);
	g.load.prepreloader.loadManifest(config.preloadManifest, true, config.assetPath);
}


// pre-preload is done
function loadStage2() {	
	g.load.preloadBG = new createjs.Bitmap(g.load.prepreloader.getResult('preloadBG'));
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
	g.stage.removeChild(g.load.progressbar);
	
	// maybe socket connection should be tracked in progress bar too?  
	g.comm = new sf.Comm(g.sockjs, g.auth);
	
	
	
	g.stage.removeChild(g.load.preloadBG);
	
	
	g.stage.update();
	
	g['background'] = new createjs.Bitmap(g.load.preloader.getResult('bg-angel'));
	g.stage.addChild(g.background);

	
	
		
	/*
	sf.Polaroid.prepareAssets();
	
	g['polaroid'] = {'frame':null, 'bg':null};
	g.polaroid.frame = new createjs.Bitmap(g.load.preloader.getResult('p-polaroid-frame'));
	g.polaroid.bg = new createjs.Bitmap(g.load.preloader.getResult('p-polaroid-bg'));
	g.polaroid.frame.y = 86;
	g.polaroid.bg.x = g.polaroid.frame.x + 11;
	g.polaroid.bg.y = g.polaroid.frame.y + 7;
	
	g.polaroid.bg.visible = g.polaroid.frame.visible = false;
	
	g.stage.addChild(g.polaroid.bg);
	*/
	
	var avatar = g['avatar'] = new sf.Avatar(null, {x:0,y:0}); 
	avatar.setLook(sf.Avatar.randomLook());//{face:0,skincolor:0,expression:0,hairstyle:0,haircolor:0,pose:0,headdir:0,bodydir:0,uniform:0,uniformcolor:0,addons:[]});
	avatar.x = 137;
	avatar.y = 105;
	g.stage.addChild(avatar);
	
	//g.stage.addChild(g.polaroid.frame);
	
	
	g.stage.update();
	
	
}
	


