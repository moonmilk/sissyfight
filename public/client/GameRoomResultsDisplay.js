// GameRoomResultsDisplay extends Container
// display one frame of end-of-turn results



// namespace:
this.sf = this.sf||{};

(function() {

var GameRoomResultsDisplay = function() {
  this.initialize.apply(this,arguments);
}

GameRoomResultsDisplay.MAX_PLAYERS = 6;
GameRoomResultsDisplay.X_STEP = 6; // number of pixels between overlapped pictures

var p = GameRoomResultsDisplay.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(assets, looksByID, results) {
		this.Container_initialize();
		
		this.assets = assets;
		this.looksByID = looksByID;
		this.results = results;
		//console.log('GRRD', this.assets, this.looksByID, this.results);
		
		this.MIDPOINT = 210; // half the width of the display area
		
		this.items = [];
		
		// draw the fake frames that give the illusion of overlapping pictures
		for (var i=0; i<results.length-1; i++) {
			var f = this.addChild(assets.results_frame_l.clone());
			f.x = i * GameRoomResultsDisplay.X_STEP;
			
			f = this.addChild(assets.results_frame_r.clone());
			f.x = (i+1) * GameRoomResultsDisplay.X_STEP;
		}
		this.items.frame = this.addChild(assets.results_frame.clone());
		this.items.bg = this.addChild(assets.results_bg.clone());
		
		// layer to draw the scene in - has a mask to keep items from leaking out
		this.items.scene = this.addChild(new createjs.Container());
		this.items.scene.x = 6;
		this.items.scene.y = 6;
		this.items.scene.mask = new createjs.Shape();
		this.items.scene.mask.graphics.beginFill('#fff').rect(0, 0, 319, 95).endFill();
		this.items.scene.mask.x = 6;
		this.items.scene.mask.y = 6;

		this.items.caption = this.addChild(new createjs.Text());
		this.items.caption.y = 104;
		
		this.items.btn_back = this.addChild(assets.results_btn_back.clone());
		this.items.btn_back.y = 105;
		this.items.btn_next = this.addChild(assets.results_btn_next.clone());
		this.items.btn_next.y = 105;
		this.items.btn_done = this.addChild(assets.results_btn_done.clone());
		this.items.btn_done.y = 104;

		this.showResult(0);
	}
	
	
	p.start = function() {
		this.items.btn_back.helper = new createjs.ButtonHelper(this.items.btn_back, 'results_back', 'results_back', 'results_back_pressed');
		this.items.btn_back.addEventListener('click', function() {this.click('back')}.bind(this));
		this.items.btn_next.helper = new createjs.ButtonHelper(this.items.btn_next, 'results_next', 'results_next', 'results_next_pressed');
		this.items.btn_next.addEventListener('click', function() {this.click('next')}.bind(this));
		this.items.btn_done.helper = new createjs.ButtonHelper(this.items.btn_done, 'results_done', 'results_done', 'results_done_pressed');
		this.items.btn_done.addEventListener('click', function() {this.click('done')}.bind(this));
	}
	
	p.destroy = function() {
		this.items.btn_back.removeAllEventListeners();
		this.items.btn_next.removeAllEventListeners();
		this.items.btn_done.removeAllEventListeners();
		this.items.scene.removeAllChildren();
	}
	
	
	p.showResult = function(n) {
		this.currentPicture = n;
		
		var step = n * GameRoomResultsDisplay.X_STEP;
		
		this.items.frame.x = step;
		this.items.bg.x = step;
		this.items.scene.x = step;
		
		this.items.caption.textAlign = 'center';
		this.items.caption.lineWidth = 237;
		this.items.caption.x = 166 + step; // was 48

		this.items.btn_back.visible = (n > 0);
		this.items.btn_next.visible = (n < (this.results.length - 1));
		this.items.btn_done.visible = (n == (this.results.length - 1));
		
		this.items.btn_back.x = -4 + step;
		this.items.btn_next.x = 294 + step;
		this.items.btn_done.x = 288 + step;
		
		this.items.caption.text = this.results[n].text;
		
		this.makeScene(this.items.scene, this.results[n]);
	}

	
	p.click = function(which) {
		switch (which) {
			case 'back':
				if (this.currentPicture > 0) this.showResult(this.currentPicture - 1);
				break;
				
			case 'next': 
				if (this.currentPicture < this.results.length - 1) this.showResult(this.currentPicture + 1);
				break;
				
			case 'done':
				this.dispatchEvent('done');
				break;
				
		}
	}
	
	
	
	p.makeScene = function(scene, results) {
		// clear out previous scene, if any
		scene.removeAllChildren();
		
		switch (results.scene) {
			case 1:
				this.makeSceneCowering(scene, results);
				break;
				
			default:
				this.makeUnfinishedScene(scene, results);
				break;
		}
		
	}
	
	
	
	// shortcut: make the avatar for a given player id, including damage if that ID is listed in damageList
	//   expression is look items to override default look
	p.makeAvatar = function(playerID, damageList, expression, x) {
		var look = _.cloneDeep(this.looksByID[playerID]);
		if (expression) _.assign(look, expression);
		look.remove_background = true;
		look.damage = damageList[playerID];
		var avatar = new sf.Avatar();
		avatar.setLook(look);
		if (x) avatar.x = x;
		avatar.y = 12;
		
		return avatar
	}
	

	// One player cowering, successfully or not
	// code: {cowerer: playerID, cower: 'good' | 'useless' | 'penalty'}
	// template for testing using player id 1:
	//		[{scene:1, text:'cower test', damage:{1:1}, code:{cowerer:1, cower:'penalty'}}]
	p.makeSceneCowering = function(scene, results) {
		var expression;
		switch (results.code.cower) {
			case 'good': 
				expression = sf.Avatar.expressions.CONTENT;
				break;
			
			case 'useless':
				expression = sf.Avatar.expressions.SAD;
				break;
				
			case 'penalty':
				expression = sf.Avatar.expressions.PAINED;
				break;
			
		}

		var avatar = this.makeAvatar(results.code.cowerer, results.damage, {expression: expression, pose: sf.Avatar.poses.COWERING}, this.MIDPOINT-30);
		scene.addChild(avatar);
	}

	
	p.makeUnfinishedScene = function(scene, results) {
		var apology = new createjs.Text("I didn't finish coding this scene :(", '14px Arial', '#883333');
		apology.textAlign = 'left';
		apology.x = 10;
		apology.y = 1
		scene.addChild(apology);
		
		var tx = 50, step = 60;
		
		if (_.size(results.damage)==0) {
			var nobody = new createjs.Text("Nobody gained or lost points in this round.", '14 px Arial Bold', '#000000');
			nobody.x = 10;
			nobody.y = 40;
			scene.addChild(nobody);
		}
		
		_.each(results.damage, function(points, id) {
			var look = _.cloneDeep(this.looksByID[id]);
			look.remove_background = true;
			look.damage = points;
			
			var avatar = new sf.Avatar();
			avatar.setLook(look);
			avatar.x = tx;
			avatar.y = 10;
			scene.addChild(avatar);
			
			
			tx += step;
		}, this);
	}
	
	
	
	
	
	
	sf.GameRoomResultsDisplay = GameRoomResultsDisplay;

})()