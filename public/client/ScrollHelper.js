/* ScrollHelper:
	given a target Container, scroll it with calls to the scroll() method:
		scroll('up') 	- up by one page
		scroll('down') 	- down by one page
		scroll(integer) - scroll by pixels (+ for down, - for up) used for scroll wheel / touchpad scrolling
  
	target: Container	- its y will be manipulated
		target must support getScrollSize():integer which returns pixel height for scrolling purposes
		optionally supports getScrollable():boolean - return false to disable scrolling
	args:
		pageSize: integer	- page size in pixels (default 120)
		windowSize: integer	- size of visible region in pixels (default 200)
		scrollVar: string	- property of target to manipulate (default 'y')
		
		
	
	Also, utility static methods to grab and release mousewheel events:
	sf.ScrollHelper.captureMouseWheel(stage, callback)
	sf.ScrollHelper.releaseMouseWheel(stage)

*/

// namespace:
this.sf = this.sf||{};

(function() {

var ScrollHelper = function(target, args) {
  this.initialize(target, args);
}


var p = ScrollHelper.prototype;
	
	p.initialize = function(target, args) {
		this.target = target;
		
		if (typeof pageSize == undefined) pageSize = 120;
		if (typeof windowSize == undefined) windowSize = 200;
		if (typeof scrollVar == undefined) scrollVar = 'y';
		
		this.args = args;
	}
	
	p.destroy = function() {
		
	}

		
	p.scroll = function(how) {
		// skip if getScrollable says no scrolling
		if (this.target.getScrollable && !this.target.getScrollable()) return;
	
		var currentY = this.target[this.args.scrollVar];
		var doTween;

		if (how=='down') {
			var destY = currentY + 120;
			doTween = true;
		}
	
		else if (how=='up') {
			var destY = currentY - 120;
			doTween = true;
		}
		else if (typeof how == 'number') {
			// deltaY from mouse wheel, for example
			var destY = currentY + how;
			doTween = false;
		}
		
		// protect against scrolling too far
		if (destY > 0) destY = 0;
		if (destY < (this.args.windowSize - this.target.getScrollSize())) {
			destY = this.args.windowSize - this.target.getScrollSize();
		}
		
		// make the move, by tween or directly
		if (doTween) {
			var tweenDest = {};
			tweenDest[this.args.scrollVar] = destY;
			
			var slide = createjs.Tween
				.get(this.target)
				.to(tweenDest}, 100+2*Math.abs(currentY-destY), createjs.Ease.quadOut);
		}
		else {
			this.target[this.args.scrollVar] = currentY;
		}
		
	}
	
	
	// capture mousewheel: callback function should accept an integer
	ScrollHelper.captureMouseWheel = function(stage, callback) {
		stage.canvas.onmousewheel = function(event) {
			callback(event.wheelDeltaY);
			event.preventDefault(); 
			return false;
		}
	}
	
	ScrollHelper.releaseMouseWheel = function(stage) {
		stage.canvas.onmousewheel = null;
	}
	
	
	
	sf.ScrollHelper = ScrollHelper;

}())
	