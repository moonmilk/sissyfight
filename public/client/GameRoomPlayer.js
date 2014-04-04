// GameRoomPlayer extends Container

// display avatar with nametag, health, speech bubble, shadow, move status.


// namespace:
this.sf = this.sf||{};

(function() {

//args:
// position: 0-5 (0 is always current player), kept for GameRoom's use and to choose uniform and text
// facing: 0 left or 1 right
// playerInfo: {nickname, avatar}
// textElement: html div to use for chat text
var GameRoomPlayer = function() {
  this.initialize.apply(this,arguments);
}

var p = GameRoomPlayer.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(position, facing, playerInfo, textElement) {
		this.Container_initialize();
		
		this.position = position;  		// 0-5 position in gameroom
		this.facing = facing; 			// 0 left or 1 right
		this.playerInfo = playerInfo;	// {id, nicknamename, avatar} 
		this.textElement = textElement;
		
		//this.playerInfo.avatar.uniformcolor = position;
		/* gonna try a different facing system
		// players on the left side of the screen face right; the other half face left
		if (position < sf.GameRoom.MAX_PLAYERS/2) this.playerInfo.avatar.headdir = 1;
		else this.playerInfo.avatar.headdir = 0;
		// all players have left-facing posture
		this.playerInfo.avatar.bodydir = 0;
		*/
		this.playerInfo.avatar.headdir = this.playerInfo.avatar.bodydir = this.facing;
		
		// allow avatar background elements
		this.playerInfo.avatar.remove_background = false
		
		this.prepareAssets();
		
		
		
		this.items = {};
		
		
		// chat bubble
		this.items.bubble = this.addChild(this.assets.bubble.clone());
		this.items.bubble.x = 0;
		this.items.bubble.y = 0;
		
		
		this.items.shadow = this.addChild(this.assets.shadow.clone());
		this.items.shadow.x = 20;
		this.items.shadow.y = 175;
		
		this.items.avatar = this.addChild(new sf.Avatar());
		this.items.avatar.setLook(this.playerInfo.avatar);
		this.items.avatar.x = 46;
		this.items.avatar.y = 78;
		
		this.items.health = this.addChild(this.assets.heart_10.clone());
		this.items.health.x = 0;
		this.items.health.y = 81;
		this.items.health.visible = false;
		
		this.items.bootStatus = this.addChild(this.assets.boot_count_1.clone());
		this.items.bootStatus.x = 0;
		this.items.bootStatus.y = 81;
		this.items.bootStatus.visible = false;

		// text color is the same as the 2nd color in uniform palette - convert it to css rgb form:
		//var textColor = 'rgb(' + config.colors.uniforms.vars[playerInfo.avatar.uniformcolor][1].join(',') + ')';
		// try plain white text
		var textColor = '#000000';

		// experimental: move nametags down under characters
		var nametagOffset = 110;

		// make a translucent cartouche behind nametag to make it easier to read
		//this.items.nametagCartouche = this.addChild(new createjs.Shape());

		this.items.nametag = new createjs.Text(this.playerInfo.nickname, config.getFont('gamePlayerName'), textColor);
		var width = this.items.nametag.getMeasuredWidth();
		if (width > 64) {
			// try again with smaller font
			this.items.nametag = new createjs.Text(this.playerInfo.nickname, config.getFont('gamePlayerNameSmall'), textColor);
			width = this.items.nametag.getMeasuredWidth();
			//this.items.nametag.y = 76;
		}
		this.items.nametag.textBaseline = 'alphabetic';
		this.items.nametag.y = 86 + nametagOffset;

		this.items.nametag.textAlign = 'center';
		this.items.nametag.x = 43;
		this.addChild(this.items.nametag);
		
		//var halfWidth = Math.floor(width/2);
		//this.items.nametagCartouche.graphics
		//	.beginFill('rgba(255,255,255,0.80)')
		//	.drawRoundRect(43-halfWidth-2, 78 + nametagOffset, width+3, 10, 1);
			
		
		// action status (moved or undecided) 		
		this.items.status = this.addChild(this.assets.status_undecided.clone());
		this.items.status.x = 70; 
		this.items.status.y = 83;
		
		
		this.items.chatText = {htmlElement: this.textElement}; // this.addChild(new createjs.DOMElement(this.textElement));
		//this.items.chatText.setFakeScale(g.gameScale);
		//this.items.chatText.setPosition(5, 7);
		//this.items.chatText.setSize(76, 59);
		
		this.items.chatText.bigChat = false;

		
		this.chatBuffer = [];
	}
	
	
	p.start = function() {
		//this.items.chatText.setVisible(true);
		var p = this.localToGlobal(3, 7);
		this.items.chatText.htmlElement.style.position = 'absolute';
		this.items.chatText.htmlElement.style.left = p.x+"px";
		this.items.chatText.htmlElement.style.top = p.y+"px";
		this.items.chatText.htmlElement.style.visibility = 'visible';
		
		// get ticks for face animations
		this.handleTickBound = this.handleTick.bind(this);
		createjs.Ticker.addEventListener('tick', this.handleTickBound);
		var time = createjs.Ticker.getTime();
		this.faceAnim = {
			blinkTime: time + 1000 + Math.random()*5000,
			glanceTime: time + 2000 + Math.random()*9000
		};
	}
	p.destroy = function() {
		//this.items.chatText.setVisible(false);
		this.items.chatText.htmlElement.style.visibility = 'hidden';
		this.items.chatText.htmlElement.innerHTML = '';
		
		createjs.Ticker.removeEventListener('tick', this.handleTickBound);
	}
	
	
	
	
	p.prepareAssets = function() {
		this.assets = {};
		_.each(['gameroom_items', 'gameroom_bgitems', 'player_items'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);

	}
	
	
	
	// incoming chat
	p.handlesay = function(text) {
		// big text starts with !
		var bigChat = false;
		var textClass = 'gameroomChatNormal';
		if (text.charAt(0)=='!') {
			bigChat = true;
			textClass = 'gameroomChatBig';
			text = text.substr(1);
		}
		
		if (bigChat != this.items.chatText.bigChat) {
			// clear chat buffer whenever size changes
			this.chatBuffer = [];
			this.items.chatText.bigChat = bigChat;
		}
		
		this.chatBuffer.push(text);
		
		while(this.chatBuffer.length > 8) this.chatBuffer.shift();
		this.items.chatText.htmlElement.innerHTML = '<div class="' + textClass + '">' + this.chatBuffer.join('<br/>') + '</div>';
		this.items.chatText.htmlElement.scrollTop = this.items.chatText.htmlElement.scrollHeight;
		
		// count the words and do talking animation for about 300 msec per word 
		var words = text.split(/\s+/);
		var talkTime = words.length * 300 * (0.8 + 0.3*Math.random());
		if (talkTime > 3500) talkTime = 3500;
		this.talk(talkTime);
	}
	
	
	// face animations
	p.handleTick = function(tick) {
	
		if (this.faceAnim.blinkTime && this.faceAnim.blinkTime < tick.time) {
			if (this.faceAnim.blinking) {
				this.items.avatar.setBlink(false);
				this.faceAnim.blinking = false;
				this.faceAnim.blinkTime = tick.time + 1500 + Math.random()*3000;
			}
			else {
				if (this.faceAnim.talking || this.faceAnim.glancing) {
					// face in use! try blinking again later
					this.faceAnim.blinkTime = tick.time + 1000 + Math.random()*3000;
				}
				else {
					this.items.avatar.setBlink(true);
					this.faceAnim.blinking = true;
					this.faceAnim.blinkTime = tick.time + 50;
				}
			}
		}
		
		if (this.faceAnim.glanceTime && this.faceAnim.glanceTime < tick.time) {
			if (this.faceAnim.glancing) {
				this.items.avatar.setGlance(false);
				this.faceAnim.glancing = false;
				this.faceAnim.glanceTime = tick.time + 4000 + Math.random()*5000;
			}
			else {
				if (this.faceAnim.talking) {
					// face in use! try again later
					this.faceAnim.glanceTime = tick.time + 3000 + Math.random()*5000;
				}
				else {
					this.items.avatar.setGlance(true);
					this.faceAnim.glancing = true;
					this.faceAnim.glanceTime = tick.time + 2500 + Math.random(3000);
				}
			}
		}
		
		// talking is started by incoming chat, not by timer
		if (this.faceAnim.talkTime && this.faceAnim.talkTime < tick.time) {
			if (this.faceAnim.talking) {
				this.items.avatar.setTalk(false);
				this.faceAnim.talking = false;
				this.faceAnim.talkTime = null;
			}
		}
		
		// during talking, move the lips
		if (this.faceAnim.talking) {
			if (this.faceAnim.lipsTime && this.faceAnim.lipsTime < tick.time) {
				if (this.faceAnim.lips) {
					this.items.avatar.setTalk(false);
					this.faceAnim.lips = false;
					this.faceAnim.lipsTime = tick.time + 100 + Math.random(200);
				}
				else {
					this.items.avatar.setTalk(true);
					this.faceAnim.lips = true;
					this.faceAnim.lipsTime = tick.time + 100 + Math.random(200);
					// extend talk time to cover all of last "syllable" so talk timer doesn't cut off open mouth too quickly
					if (this.faceAnim.lipsTime > this.faceAnim.talkTime) {
						this.faceAnim.talkTime = this.faceAnim.lipsTime;
					}
				}
			}
		}
		
		
	}
	
	
	// "talk" for t msec
	p.talk = function(t) {
		var time = createjs.Ticker.getTime();
		this.faceAnim.talking = true;
		this.faceAnim.talkTime = time + t;
		this.faceAnim.lipsTime = time;
	}
	
	
	
	
	// requests from gameroom
	
	
	// reset the action status display to undecided
	p.resetActed = function() {
		this.items.status.gotoAndStop('status_undecided');
	}
	
	// set the action status display to decided (and blink it)
	p.setActed = function(blink) {
		this.items.status.gotoAndStop('status_decided');
		if (blink) createjs.Tween.get(this.items.status).wait(150).to({visible:false},0).wait(150).to({visible:true},0).wait(150).to({visible:false},0).wait(150).to({visible:true},0);
	}
	
	
	p.hideHealth = function(h) {
		this.items.health.visible = false;
	}
	p.setHealth = function(h) {
		this.items.health.gotoAndStop('heart_'+h);
		this.items.health.visible = true;
		this.items.bootStatus.visible = false;
	}
	p.setStatus = function(s) {
		// for now, health is the only member of status
		this.status = s;
		this.setHealth(s.health);
	}
	p.getStatus = function() {
		return this.status;
	}
	p.hasLost = function() {
		return (this.status.health==0);
	}
	
	p.setBootVotes = function(v) {
		if (v > 0 && v < 6) {
			this.items.bootStatus.gotoAndStop("boot_count_" + v);
			this.items.bootStatus.visible = true;
		}
		else {
			this.items.bootStatus.visible = false;
		}
	}
	
	p.setFacing = function(facing) {
		this.facing = facing;
		this.items.avatar.setLook({headdir:facing, bodydir:facing});
	}
	
	
	p.setPose = function(pose) {
		switch (pose) {
			case 'normal':
				this.items.avatar.setLook({pose:0, expression:0, overlays:[]});
				break
			
			case 'crying':
				this.items.avatar.setLook({pose:1, expression:3, overlays:[sf.Avatar.overlays.TEARS]});
				break			
				
			case 'victory':
				this.items.avatar.setLook({pose:2, expression:1, overlays:[]});
				break
				
		}
	}
	
	
	
	sf.GameRoomPlayer = GameRoomPlayer;

})()