/* MultiButtonHelper encapsulates ButtonHelper

   define a ButtonHelper with multiple states


   initialize with array or dictionary of states:
   MultiButtonHelper(target, states, defaultState, play, hitArea, hitLabel) - target, play, hitArea and hitLabel are same as ButtonHelper
   each state is a dict of ButtonHelper args: {out:outLabel, over:overLabel, down:downLabel}
       optional next:stateIndex - will go to that state when clicked, and dispatch a 'state' event
       can leave out over or down if they are same as out
   defaultState is index of a state in states
   
   setState(index of a state)
   
   
   


*/

// namespace:
this.sf = this.sf||{};

(function() {

var MultiButtonHelper = function() {
  this.initialize.apply(this, arguments);
}


var p = MultiButtonHelper.prototype;

	p.initialize = function(target, states, defaultStateIndex, play, hitArea, hitLabel) {
		
		this.target = target;
		this.states = states;
		this.currentStateIndex = defaultStateIndex;
		var currentState = this.states[defaultStateIndex];
		this.helper = new createjs.ButtonHelper(target, currentState.out, currentState.over || currentState.out, currentState.down || currentState.out, play, hitArea, hitLabel);
		
		target.addEventListener('click', this.clickHandler.bind(this));
	}


	p.setState = function(stateIndex) {
		this.currentStateIndex = stateIndex;
		var currentState = this.states[stateIndex];
		this.helper.outLabel = currentState.out;
		this.helper.overLabel = currentState.over || currentState.out;
		this.helper.downLabel = currentState.down || currentState.out;
		if (this.helper.play) this.target.gotoAndPlay(this.helper.outLabel);
		else this.target.gotoAndStop(this.helper.outLabel);
	}
	
	
	p.clickHandler = function(event) {
		var currentState = this.states[this.currentStateIndex];
		if (currentState.next) {
			var newState = currentState.next;
			this.setState(newState);
			this.target.dispatchEvent({type:'state',state:newState});
		}
		else {
			this.target.dispatchEvent({type:'multiclick'});  // ugh. can't reuse click because i would catch it myself
		}
	}



	sf.MultiButtonHelper = MultiButtonHelper;


})()