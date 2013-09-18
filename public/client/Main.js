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
	
	p.start = function(SockJS, auth, school) {
		this.getStage().enableMouseOver();
		
		// set up tick-based update
		this.getStage().maybeUpdate = function() { }; // can alias this to g.stage.update if i decide to switch back to on-demand updates
		createjs.Ticker.addEventListener('tick', function(event) {
			this.getStage().update();
		}.bind(this));		
		
		this.loader = new sf.Loader();
		this.addChild(this.loader);
		this.loader.start(SockJS, auth, school);
		
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
		
		this.openDressingRoom(event.data);
	}
	
	
	p.openDressingRoom = function(data)	{
		console.log("Opening dressing room");
		this.dressing = new sf.DressingRoom(data.avatar, data.nickname);
		this.addChild(this.dressing);
		this.dressing.start();
		
		this.dressing.addEventListener("done", function(event) {
			this.closeDressingRoom();
			this.openHomeroom(event.data);
		}.bind(this));
	}
	
	p.closeDressingRoom = function(event) {
		console.log("Closing dressing room");
		this.dressing.destroy();
		this.removeChild(this.dressing);
		this.dressing.removeAllEventListeners();
		this.dressing = null;
	}
	
	
	
	p.openHomeroom = function(data) {
		console.log("Opening homeroom");
		this.homeroom = new sf.Homeroom();
		this.addChild(this.homeroom);
		this.homeroom.start();
		
		this.homeroom.addEventListener("dressing", function(event) {
			this.closeHomeroom();
			this.openDressingRoom(event.data);
		});
		/* not yet
		this.homeroom.addEventListener("game", function(event) {
			this.closeHomeroom();
			this.openGameRoom(event.data);
		});
		*/
	}
	

	sf.Main = Main;

})();


