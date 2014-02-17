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
	}

	Sound.buttonClick = function() {
		Sound.play("snd_click");
	}

	sf.Sound = Sound;

})();

