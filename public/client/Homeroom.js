// Homeroom extends Container

// namespace:
this.sf = this.sf||{};

(function() {

var Homeroom = function(look, nickname) {
  this.initialize(look, nickname);
}

var p = Homeroom.prototype = new createjs.Container();

	p.Container_initialize = p.initialize;
	
	p.initialize = function() {
		this.Container_initialize();	
		
		this.prepareAssets();
		
		this.addChild(this.assets.homeroom_bg.clone());
		this.chatRecord = new createjs.DOMElement(document.getElementById('homeroomChat'));
		this.chatEntry = new createjs.DOMElement(document.getElementById('homeroomTextEntry'));
	}
	
	
	p.start = function() {
		
	}



	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_bg'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
	sf.Homeroom = Homeroom;


})()