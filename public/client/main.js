/*
	sissyfight startup!
*/


// sissyfight namespace
this.sf = this.sf||{};

(function() {

var Main = function() {
  this.initialize();
}
var p = Main.prototype = new createjs.Container();
	p.Container_initialize = p.initialize;

	// instance vars
	p.loader = undefined;
	
	p.initialize = function() {
		this.Container_initialize();
	}
	
	p.start = function(SockJS, auth) {
		this.getStage().enableMouseOver();
		
		// set up tick-based update
		this.getStage().maybeUpdate = function() { }; // can alias this to g.stage.update if i decide to switch back to on-demand updates
		createjs.Ticker.addEventListener('tick', function(event) {
			this.getStage().update();
		}.bind(this));		
		
		this.loader = new sf.Loader();
		this.addChild(this.loader);
		this.loader.start(SockJS, auth);
		
		this.loader.addEventListener("error", this.loadError.bind(this));
		this.loader.addEventListener("complete", this.loaded.bind(this));
	}
	
	p.loadError = function(event) {
		// ????
	}
	p.loaded = function(event) {
		this.removeChild(this.loader);
		this.loader.removeAllEventListeners();
		this.loader = null;
		
		g.dressing.room = new sf.DressingRoom(event.data.avatar, event.data.nickname);
		this.addChild(g.dressing.room);
		g.dressing.room.start();
	}

	sf.Main = Main;

})();


