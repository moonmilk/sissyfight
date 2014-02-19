// Sound helper
//   nothing but class functions

// namespace:
this.sf = this.sf||{};


(function() {
var Sound = function() {
	
}

	Sound.play = function(sound, loopFlag) {
		var soundInstance = createjs.Sound.play(sound, {loop:(loopFlag?-1:0)}); // -1 is infinite loops
		//console.log("Sound.play",soundInstance);
		return soundInstance;
	}
	
	Sound.setMute = function(muteFlag) {
		createjs.Sound.setMute(muteFlag);
		
		// make mute choice persistent in cookie for a year
		if (muteFlag) document.cookie = 'sfmute=1;max-age=' + 60*60*24*365;
		else document.cookie = 'sfmute=0;max-age=' + 60*60*24*365;
	}
	
	// call checkMute on startup to see if user had mute set
	Sound.checkMute = function() {
		if (document.cookie.match(/sfmute=1/)) Sound.setMute(true);
		else Sound.setMute(false);
	}
	
	Sound.getMute = function() {
		return createjs.Sound.getMute();
	}

	Sound.buttonClick = function() {
		Sound.play("snd_click");
	}	
	
	Sound.keyClick = function() {
		Sound.play("snd_keyclick");
	}

	sf.Sound = Sound;

})();

