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
		
		// mess with DOMElement (why didn't they do this, at least?)
		// TODO: make my own subclass of DOMElement
		createjs.DOMElement.prototype.setFakeScale = function(s) {
			this.fakeScale = s;
		}
		createjs.DOMElement.prototype.setPosition = function(x, y) {
			this.htmlElement.style.position = 'absolute';
			this.htmlElement.style.left = 	((this.fakeScale ? this.fakeScale : 1) * x) + 'px';
			this.htmlElement.style.top = 	((this.fakeScale ? this.fakeScale : 1) * y) + 'px';
		}
		createjs.DOMElement.prototype.setSize = function(w, h) {
			this.htmlElement.style.position = 'absolute';
			this.htmlElement.style.width = 	((this.fakeScale ? this.fakeScale : 1) * w) + 'px';
			this.htmlElement.style.height =	((this.fakeScale ? this.fakeScale : 1) * h) + 'px';
		}
		createjs.DOMElement.prototype.setVisible = function(v) {
			if (v) this.htmlElement.style.visibility = 'visible';
			else this.htmlElement.style.visibility = 'hidden';
		}
		this.chatRecord = new createjs.DOMElement(document.getElementById('homeroomChat'));
		this.chatEntry = new createjs.DOMElement(document.getElementById('homeroomTextEntry'));
	}
	
	
	p.start = function() {
		/*
		this.chatEntry.htmlElement.style.position = 'absolute';
		this.chatEntry.htmlElement.style.left = "7px";
		this.chatEntry.htmlElement.style.top = "228px";
		this.chatEntry.htmlElement.style.width = "79px";
		this.chatEntry.htmlElement.style.height = "43px";
		*/
		this.chatEntry.setFakeScale(g.gameScale);
		this.chatEntry.setPosition(6, 227);
		this.chatEntry.setSize(78, 42);
		this.chatEntry.setVisible(true);
		
		this.chatRecord.setFakeScale(g.gameScale);
		this.chatRecord.setPosition(12,33);
		this.chatRecord.setSize(120, 150);
		this.chatRecord.setVisible(true);
		
		this.chatRecord.htmlElement.innerHTML = "I like bananas<br/>Because they have no bones!"
	}


	// clean up
	p.destroy = function() {
		this.chatEntry.setVisible(false);
		this.chatRecord.setVisible(false);
	}


	p.prepareAssets = function() {
		this.assets = {};
		_.each(['homeroom_bg'], function(s) {
			g.load.unpack(s, this.assets);
		}, this);
	}
	
	
		
	sf.Homeroom = Homeroom;


})()