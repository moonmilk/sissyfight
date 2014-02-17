// Sound helper
//   nothing but class functions

// namespace:
this.sf = this.sf||{};


(function() {
var Sound = function() {
	
}

	Sound.play = function(sound, loopFlag) {
		var soundInstance = createjs.Sound.play(sound, 0, 0, (loopFlag?1:0));
	}
	
	Sound.mute = function(muteFlag) {
		createjs.Sound.setMute(muteFlag);
		
		// make mute choice persistent in cookie for a year
		if (muteFlag) document.cookie = 'sfmute=1;max-age=' + 60*60*24*365;
		else document.cookie = '';
	}
	
	// call checkMute on startup to see if user had mute set
	Sound.checkMute = function() {
		if (document.cookie.match(/sfmute=1/)) Sound.mute(true);
		else Sound.mute(false);
	}
	
	Sound.getMute = function() {
		return createjs.Sound.getMute();
	}

	Sound.buttonClick = function() {
		Sound.play("snd_click");
	}

	sf.Sound = Sound;

})();

