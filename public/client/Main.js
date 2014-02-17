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
		this.SockJS = SockJS;
		this.auth = auth;
		this.school = school;
		
		// start mouseover testing
		this.getStage().enableMouseOver();
		
		// set up tick-based update
		this.getStage().maybeUpdate = function() { }; // can alias this to g.stage.update if i decide to switch back to on-demand updates
		createjs.Ticker.addEventListener('tick', function(event) {
			this.getStage().update();
		}.bind(this));		
		
		
		// start the loader
		this.loader = new sf.Loader();
		this.addChild(this.loader);
		this.loader.start(school);
		
		this.loader.addEventListener('loaded', this.loaded.bind(this));
	}
	
	
	p.loaded = function(event) {
		// check mute preferences
		sf.Sound.checkMute();
		
		// start the socket connection
		g.comm = new sf.Comm(this.SockJS, this.auth);
		// have to do something with failed login
		g.comm.addEventListener('loginError', this.loginError.bind(this));
		//successful login will send the go(dressingroom) event
		g.comm.addEventListener('go', this.goHandler.bind(this));
	}
	
	p.cleanupLoader = function() {
		this.removeChild(this.loader);
		this.loader.removeAllEventListeners();
		this.loader = null;
	}
	
	p.loginError = function(event) {
		// TODO: what to do?
		console.log('main: login problem - ' + event.data);
	}
	
	
	// go event: server tells client which screen to go to
	//		data.to = dressingroom, homeroom, gameroom
	//		with additional data depending on the destination	
	p.goHandler = function(event) {
		//console.log("goHandler got " + event.data.to + " and loader dressing and homeroom are ", this.loader, this.dressing, this.homeroom);
		if (this.loader) this.cleanupLoader();
		if (this.dressing) this.closeDressingRoom();
		if (this.homeroom) this.closeHomeroom();
		if (this.gameroom) this.closeGameRoom();
		
		if (event.data && event.data.to) {
			switch(event.data.to) {
				case 'dressingroom': 
					this.openDressingRoom(event.data);
					break;
					
				case 'homeroom':
					this.openHomeroom(event.data);
					break;
					
				case 'gameroom':
					this.openGameRoom(event.data);
					break;
					
				default:
					console.log('main: got a go event with unknown destination ' + event.data.to);
					break;
			}
		}
		else {
			// ?????
			console.log('main: got a go event with no destination');
		}
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
		this.homeroom = new sf.Homeroom(data.avatar, data.nickname, data.occupants, data.games);
		this.addChild(this.homeroom);
		this.homeroom.start();
	}
	
	p.closeHomeroom = function() {
		console.log("Closing homeroom");
		this.homeroom.destroy();
		this.removeChild(this.homeroom);
		this.homeroom = null;
	}
	
	
	
	p.openGameRoom = function(data) {
		console.log("Opening gameroom");
		this.gameroom = new sf.GameRoom(data.me, data.room);
		this.addChild(this.gameroom);
		this.gameroom.start();
	}
	
	p.closeGameRoom = function(data) {
		console.log("Closing gameroom");
		this.gameroom.destroy();
		this.removeChild(this.gameroom);
		this.gameroom = null;
	}
	
	

	sf.Main = Main;

})();


