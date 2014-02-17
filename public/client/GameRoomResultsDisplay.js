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

		this.items.caption = new createjs.DOMElement(document.getElementById('gameroomCaption'));
		
		this.items.btn_back = this.addChild(assets.results_btn_back.clone());
		this.items.btn_back.y = 105;
		this.items.btn_next = this.addChild(assets.results_btn_next.clone());
		this.items.btn_next.y = 105;
		this.items.btn_done = this.addChild(assets.results_btn_done.clone());
		this.items.btn_done.y = 104;

		this.showResult(0);
	}
	
	
	p.start = function() {
		// make a larger hit area for back and next buttons
		var hitbox = new createjs.Shape(new createjs.Graphics().f("#f00").dr(-2,-2, 54,27));
		this.items.btn_back.hitArea = hitbox;
		this.items.btn_next.hitArea = hitbox;
		
		this.items.btn_back.helper = new createjs.ButtonHelper(this.items.btn_back, 'results_back', 'results_back', 'results_back_pressed');
		this.items.btn_back.addEventListener('click', function() {this.click('back')}.bind(this));
		this.items.btn_next.helper = new createjs.ButtonHelper(this.items.btn_next, 'results_next', 'results_next', 'results_next_pressed');
		this.items.btn_next.addEventListener('click', function() {this.click('next')}.bind(this));
		this.items.btn_done.helper = new createjs.ButtonHelper(this.items.btn_done, 'results_done', 'results_done', 'results_done_pressed');
		this.items.btn_done.addEventListener('click', function() {this.click('done')}.bind(this));
		
		// set up caption html text
		this.items.caption.setFakeScale(g.gameScale);
		this.items.caption.setSize(245, 25);
		this.items.caption.setVisible(true);
	}
	
	p.destroy = function() {
		this.items.btn_back.removeAllEventListeners();
		this.items.btn_next.removeAllEventListeners();
		this.items.btn_done.removeAllEventListeners();
		this.items.scene.removeAllChildren();
		this.items.caption.setVisible(false);
	}
	
	
	p.showResult = function(n) {
		this.currentPicture = n;
		
		var step = n * GameRoomResultsDisplay.X_STEP;
		
		this.items.frame.x = step;
		this.items.bg.x = step;
		this.items.scene.x = step;
		this.items.scene.mask.x = step + 6;
		
		this.items.caption.textAlign = 'center';
		this.items.caption.lineWidth = 237;
		this.items.caption.x = 166 + step; // was 48

		this.items.btn_back.visible = (n > 0);
		this.items.btn_next.visible = (n < (this.results.length - 1));
		this.items.btn_done.visible = (n == (this.results.length - 1));
		
		this.items.btn_back.x = -4 + step;
		this.items.btn_next.x = 294 + step;
		this.items.btn_done.x = 288 + step;
		
		this.items.caption.htmlElement.textContent = this.results[n].text;
		this.items.caption.setPosition(134+step, 222); // HTMLElement is positioned relative to canvas rather than parent
		this.items.caption.setVisible(true);
		
		this.makeScene(this.items.scene, this.results[n]);
	}

	
	p.click = function(which) {
		sf.Sound.buttonClick();
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
			case 'cower':
				this.makeSceneCowering(scene, results);
				break;
				
			case 'grabscratch':
				this.makeSceneGrabScratch(scene, results);
				break;
				
			case 'mutualscratch':
				this.makeSceneMutualScratch(scene, results);
				break;
				
			case 'mutualtease':
				this.makeSceneMutualTease(scene, results);
				break;
				
			case 'tease':
				this.makeSceneTease(scene, results);
				break;	
				
			case 'tattle':
				this.makeSceneTattle(scene, results);
				break;
				
			case 'failedtattle':
				this.makeSceneFailedTattle(scene, results);
				break;
				
			case 'lolly':
				this.makeSceneLolly(scene, results);
				break;
				
			case 'humiliated':
				this.makeSceneHumiliated(scene, results);
				break;
				
			case 'timeout':
				this.makeSceneTimeout(scene, results);
				break;
			
			case 'leave':
				this.makeSceneLeave(scene, results);
				break;
				
				
			case 'servererror':
			default:
				this.makeUnfinishedScene(scene, results);
				break;
		}
		
	}
	
	
	
	// shortcut: make the avatar for a given player id, including damage if that ID is listed in damageList
	//   expression is look items to override default look
	p.makeAvatar = function(playerID, damageList, expression, x) {
		//console.log('GameRoomResultsDisplay.makeAvatar: ', playerID, damageList, expression, x);
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
	

	// One player cowering, successfully or not, alone or with grabber or scratcher
	// code: {victim: playerID, cower: 'good' | 'useless' | 'penalty', from: 'grab' | 'scratch' | null, attacker: attackerID | null}
	// template for testing using player id 1:
	//		r([{scene:'cower', text:'cower test', damage:{1:1}, code:{victim:1, cower:'penalty'}}])
	//		r([{scene:'cower', text:'cower test', damage:{}, code:{victim:1, cower:'good', from:'scratch', attacker:1}}])
	p.makeSceneCowering = function(scene, results) {
		var victimExpression;
		switch (results.code.cower) {
			case 'good': 
				victimExpression = sf.Avatar.expressions.CONTENT;
				break;
			
			case 'useless':
				victimExpression = sf.Avatar.expressions.SAD;
				break;
				
			case 'penalty':
				victimExpression = sf.Avatar.expressions.PAINED;
				break;
			
		}

		var victimAvatar = this.makeAvatar(results.code.victim, results.damage, {expression: victimExpression, pose: sf.Avatar.poses.COWERING, headdir:1, bodydir:1}, this.MIDPOINT-60);
		scene.addChild(victimAvatar);
		
		if (results.code.attacker) {
			var attackerPose = sf.Avatar.poses.SCRATCHING;
			if (results.code.from=='grab') attackerPose = sf.Avatar.poses.GRABBING;
			
			var attackerOffset = 55;
		
			var attackerAvatar = this.makeAvatar(results.code.attacker, results.damage, {expression: sf.Avatar.expressions.NEUTRAL, pose:attackerPose, headdir:0, bodydir:0}, this.MIDPOINT-60+attackerOffset);
			scene.addChild(attackerAvatar);
		}
		
	}



	// 2, 3, 6, 7: One player grabbed/scratched by one or more opponents, with or without a lolly
	//		{grabbers: [123, 456], scratchers:[], victim: 789, lolly:(grab, scratch, or none)}
	// r([{scene:'grabscratch', text:'hello', damage:{}, code:{victim:1, lolly:'none', grabbers:[1,1], scratchers:[]}}])
	p.makeSceneGrabScratch = function(scene, results) {
		var victimExpression, victimPose, victimOverlays;
		
		// show what happened to the lolly
		switch (results.code.lolly) {
			case 'grab':
				victimExpression = sf.Avatar.expressions.SAD;
				victimPose = sf.Avatar.expressions.NEUTRAL;
				victimOverlays = [sf.Avatar.overlays.HOLDLOLLY];
				break;
			case 'scratch':
				victimExpression = sf.Avatar.expressions.PAINED;
				victimPose = sf.Avatar.expressions.NEUTRAL;
				victimOverlays = [sf.Avatar.overlays.CHOKE];	
				break;
			default:
				victimExpression = sf.Avatar.expressions.SAD;
				victimPose = sf.Avatar.expressions.NEUTRAL;
				victimOverlays = [];
				break;
		}
		// show scratched face
		if (results.code.scratchers.length > 0) {
			victimOverlays.push(sf.Avatar.overlays.SCRATCH);
		}
		
		var centering = 45 - results.code.grabbers.length*25 + results.code.scratchers.length*20;
		var midpoint = Math.floor(this.MIDPOINT - centering / 2); 

		// draw the grabbed victim
		var grabbedAvatar = this.makeAvatar(results.code.victim, results.damage, 
			{expression: victimExpression, pose: victimPose, overlays: victimOverlays, headdir:0, bodydir:0}, midpoint-30);
		scene.addChild(grabbedAvatar);
		
		// draw the grabbers
		for (var i=results.code.grabbers.length-1; i>=0; i--) {
			var grabberAvatar = this.makeAvatar(results.code.grabbers[i], results.damage, 
				{expression: sf.Avatar.expressions.CONTENT, pose: sf.Avatar.poses.GRABBING, headdir:1, bodydir:1}, midpoint-66-20*i);
			scene.addChild(grabberAvatar);
		}

		// draw the scratchers
		for (var i=0; i<results.code.scratchers.length; i++) {
			var grabberAvatar = this.makeAvatar(results.code.scratchers[i], results.damage, 
				{expression: sf.Avatar.expressions.CONTENT, pose: sf.Avatar.poses.SCRATCHING, headdir:0, bodydir:0}, midpoint-30+37+25*i);
			scene.addChild(grabberAvatar);
		}
		
	}
	
	// two players scratch each other
	//  r([{scene:'mutualscratch', text:'mutual scratch test', damage:{}, code:{scratchers:[1,1]}}])
	p.makeSceneMutualScratch = function(scene,results) {
		
		var leftScratcher = this.makeAvatar(results.code.scratchers[0], results.damage,
			{expression: sf.Avatar.expressions.PAINED, pose:sf.Avatar.poses.SCRATCHING, overlays:[sf.Avatar.overlays.SCRATCH], headdir:0, bodydir:1}, this.MIDPOINT-80);
		scene.addChild(leftScratcher);
		
		var rightScratcher = this.makeAvatar(results.code.scratchers[1], results.damage,
			{expression: sf.Avatar.expressions.PAINED, pose:sf.Avatar.poses.SCRATCHING, overlays:[sf.Avatar.overlays.SCRATCH], headdir:1, bodydir:0}, this.MIDPOINT-10);
		scene.addChild(rightScratcher);
	}	
	
	// two players tease each other, tease fails
	//  r([{scene:'mutualtease', text:'mutual tease test', damage:{}, code:{teasers:[1,1]}}])
	p.makeSceneMutualTease = function(scene,results) {
		
		var leftTeaser = this.makeAvatar(results.code.teasers[0], results.damage,
			{expression: sf.Avatar.expressions.NEUTRAL, pose:sf.Avatar.poses.TEASING, headdir:1, bodydir:1}, this.MIDPOINT-90);
		scene.addChild(leftTeaser);
		
		var rightTeaser = this.makeAvatar(results.code.teasers[1], results.damage,
			{expression: sf.Avatar.expressions.NEUTRAL, pose:sf.Avatar.poses.TEASING, headdir:0, bodydir:0}, this.MIDPOINT+10);
		scene.addChild(rightTeaser);
	}
	
	// victim is teased by one or more players
	//   r([{scene:'tease', text:'tease test', damage:{1:2}, code:{victim:1, teasers:[1,1], teased:true}}])
	//   r([{scene:'tease', text:'tease test', damage:{}, code:{victim:1, teasers:[1], teased:false}}])
	p.makeSceneTease = function(scene, results) {
		var victimExpression;
		var teasersExpression;
		if (results.code.teased) {
			victimExpression = sf.Avatar.expressions.SAD;
			teasersExpression = sf.Avatar.expressions.CONTENT;
		}
		else {
			victimExpression = sf.Avatar.expressions.CONTENT;
			var teasersExpression = sf.Avatar.expressions.NEUTRAL;
		}
		
		var victimAvatar = this.makeAvatar(results.code.victim, results.damage,
			{expression: victimExpression, pose: sf.Avatar.poses.NEUTRAL, headdir:0, bodydir:0}, this.MIDPOINT + 30);
		scene.addChild(victimAvatar);
		
		for (var i=0; i<results.code.teasers.length; i++) {
			var teaserAvatar = this.makeAvatar(results.code.teasers[i], results.damage,
				{expression: teasersExpression, pose: sf.Avatar.poses.TEASING, headdir:1, bodydir:1}, this.MIDPOINT-35 - 45*i);
			scene.addChild(teaserAvatar);	
		}	
		
	}
	
	
	// successful tattle (1 tattler, 0+ victims, 0+ innocents)
	//	r([scene:'tattle', text:'tattle test', damage:{}, code:{tattler:1, victims:[1, 1], innocents:[1,1]}}])
	p.makeSceneTattle = function(scene, results) {
		var avX = -120;
		var tattlerAvatar = this.makeAvatar(results.code.tattler, results.damage,
			{expression: sf.Avatar.expressions.CONTENT, pose: sf.Avatar.poses.TATTLING, headdir:0, bodydir:0}, this.MIDPOINT+avX);
		scene.addChild(tattlerAvatar);
		avX += 80;
		
		for (var i=0; i<results.code.victims.length; i++) {
			var victimAvatar = this.makeAvatar(results.code.victims[i], results.damage,
				{expression: sf.Avatar.expressions.SAD, pose: sf.Avatar.poses.NEUTRAL, headdir:0, bodydir:0}, this.MIDPOINT+avX);
			scene.addChild(victimAvatar);
			avX += 60;
		}
		avX += 20;
		
		for (var i=0; i<results.code.innocents.length; i++) {
			var victimAvatar = this.makeAvatar(results.code.innocents[i], results.damage,
				{expression: sf.Avatar.expressions.CONTENT, pose: sf.Avatar.poses.NEUTRAL, headdir:0, bodydir:0}, this.MIDPOINT+avX);
			scene.addChild(victimAvatar);
			avX += 60;
		}		
		
	}
	
	// failed tattle (>1 tattlers)
	//   r([{scene:'failedtattle', text:'failed tattle test', damage:{}, code:{tattlers:[1,1]}}])
	p.makeSceneFailedTattle = function(scene, results) {
		var avX = -30-30*results.code.tattlers.length;
			
		for (var i=0; i<results.code.tattlers.length; i++) {
			var tattlerAvatar = this.makeAvatar(results.code.tattlers[i], results.damage,
				{expression: sf.Avatar.expressions.SAD, pose: sf.Avatar.poses.NEUTRAL, headdir:0, bodydir:0}, this.MIDPOINT+avX);
			scene.addChild(tattlerAvatar);
			avX += 60;
		}
	}


	// licking lolly (1+ lickers) 
	//	r([{scene:'lolly', text:'lolly test', damage:{1:-2}, code:{lickers:[1,1]}}])
	p.makeSceneLolly = function(scene, results) {
		var avX = -30-30*results.code.lickers.length;
			
		for (var i=0; i<results.code.lickers.length; i++) {
			var tattlerAvatar = this.makeAvatar(results.code.lickers[i], results.damage,
				{expression: sf.Avatar.expressions.CONTENT, pose: sf.Avatar.poses.LICKING, overlays:[sf.Avatar.overlays.LICK], headdir:0, bodydir:0}, this.MIDPOINT+avX);
			scene.addChild(tattlerAvatar);
			avX += 60;
		}
	}
	
	
	// humiliated
	//	r([{scene:'humiliated', text:'humiliated test', damage:{}, code:{loser:1}}])
	p.makeSceneHumiliated = function(scene, results) {
		var loserAvatar = this.makeAvatar(results.code.loser, results.damage,
			{expression: sf.Avatar.expressions.SAD, pose: sf.Avatar.poses.HUMILIATED, overlays:[sf.Avatar.overlays.TEARS], headdir:1, bodydir:1}, this.MIDPOINT-30);
		loserAvatar.y -= 12;
		scene.addChild(loserAvatar);
		
	}

	
	// timeout
	//	r([{scene:'timeout', text:'humiliated test', damage:{}, code:{loser:1}}])
	p.makeSceneTimeout = function(scene, results) {
		var loserAvatar = this.makeAvatar(results.code.loser, results.damage,
			{expression: sf.Avatar.expressions.SAD, pose: sf.Avatar.poses.NEUTRAL,  headdir:1, bodydir:1}, this.MIDPOINT-30);
		scene.addChild(loserAvatar);		
	}


	// premature departure
	//	r([{scene:'leave', text:'humiliated test', damage:{}, code:{loser:1}}])
	p.makeSceneLeave = function(scene, results) {
		var loserAvatar = this.makeAvatar(results.code.loser, results.damage,
			{expression: sf.Avatar.expressions.SAD, pose: sf.Avatar.poses.NEUTRAL,  headdir:0, bodydir:0}, 0); // halfway out the door
		scene.addChild(loserAvatar);		
	}


	
	
	p.makeUnfinishedScene = function(scene, results) {
		var apology = new createjs.Text("Unknown scene :(", '14px Arial', '#883333');
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