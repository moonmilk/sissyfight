// GameRoom extends Container




// namespace:
this.sf = this.sf||{};

(function() {

var GameRoom = function(me, gameInfo) {
  this.initialize(me, gameInfo);
}

var p = GameRoom.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function(me, gameInfo) {
		this.Container_initialize();
		
		this.prepareAssets();
		
		this.me = me; // id of this player, so I don't need any memory to know which one is me
		this.gameInfo = gameInfo; // game(id), gameName, occupants:[{id,nickname,avatar}]
		
		this.players = [];
		this.playerPositions = {};  // map id->player
		
		this.chatbubbles = [];
		this.nametags = [];
		
		for (var i=0; i<6; i++) {
			this.chatbubbles[i] = new createjs.DOMElement(document.getElementById('gameroomChatBubble'+i));
			this.addChild(this.chatbubbles[i]);
			this.chatbubbles[i].setFakeScale(g.gameScale);
			this.chatbubbles[i].setPosition(8+86*i+6*(i>0), 28);
			this.chatbubbles[i].setSize(76, 64);
			this.chatbubbles[i].setVisible(false);
			
			this.nametags[i] = new createjs.Text();
			this.addChild(this.nametags[i]);
			this.nametags[i].x = 25+86*i+6*(i>0);
			this.nametags[i].y = 103;
			this.nametags[i].visible = false;
		}
	}
	
	
	p.start = function() {
		// server will send occupants with me first, so don't need to worry about order (this player is always in position 0 on screen)
		_.each(this.gameInfo.occupants, function(player) {
			this.addPlayer(player);
		}, this);
	}
	
	
	
	
	p.addPlayer = function(player) {
		
	}
	
	
	
		

	p.prepareAssets = function() {
		this.assets = {};
		_.each([], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
	sf.GameRoom = GameRoom;


})()