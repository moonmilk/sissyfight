/*
* ColorSubstitutionFilter
* Ranjit Bhatnagar 2013
* 
* based on ColorFilter, Copyright (c) 2010 gskinner.com, inc.
* Visit http://createjs.com/ for documentation, updates and examples.
*
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
this.createjs = this.createjs||{};

(function() {

/**
 * Substitutes exact colors in DisplayObjects - most useful for recoloring palette-based graphics.
 *
 * <h4>Example</h4>
 *      var shape = new createjs.Shape().set({x:100,y:100});
 *      shape.graphics.beginFill("#ff0000").drawCircle(0,0,50);
 *
 *      shape.filters = [
 *          new createjs.ColorSubstitutionFilter(0,0,0,1, 0,0,255,0)
 *      ];
 *      shape.cache(-50, -50, 100, 100);
 *
 * See {{#crossLink "Filter"}}{{/crossLink}} for an more information on applying filters.
 * @class ColorSubstitutionFilter
 * @param {Array} [matchColors=[]] Array of colors to match (represented as 3-element or 4-element arrays)
 * @param {Array} [substituteColors=[]] Array of colors to substitute for the matched colors (must be the same length as matchColors)
 * @constructor
 * @extends Filter
 **/
var ColorSubstitutionFilter = function(matchColors, substituteColors) {
  this.initialize(matchColors, substituteColors);
}
var p = ColorSubstitutionFilter.prototype = new createjs.Filter();

// public properties:
	/**
	 * matchColors array.
	 * @property matchColors
	 * @type Array
	 **/
	p.matchColors = [];
	/**
	 * substituteColors array.
	 * @property substituteColors
	 * @type Array
	 **/
	p.substituteColors = [];


// constructor:
	/**
	 * Initialization method.
	 * @method initialize
	 * @param {Array} [matchColors=[]] Array of colors to match (represented as 3-element or 4-element arrays)
	 * @param {Array} [substituteColors=[]] Array of colors to substitute for the matched colors (must be the same length as matchColors)
	 * @protected
	 **/
	p.initialize = function(matchColors, substituteColors) {
		this.matchColors = matchColors != null ? matchColors : [];
		this.substituteColors = substituteColors != null ? substituteColors : [];
	}

// public methods:
	p.applyFilter = function(ctx, x, y, width, height, targetCtx, targetX, targetY) {
		targetCtx = targetCtx || ctx;
		if (targetX == null) { targetX = x; }
		if (targetY == null) { targetY = y; }
		try {
			var imageData = ctx.getImageData(x, y, width, height);
		} catch(e) {
			//if (!this.suppressCrossDomainErrors) throw new Error("unable to access local image data: " + e);
			return false;
		}
		var colorMapLength = this.matchColors.length;
		
		var data = imageData.data;
		var l = data.length;
		var n = 0;
		for (var i=0; i<l; i+=4) {
			for (var m=0; m<colorMapLength; m++) {
				var matched = true;
				for (var p=0; p<this.matchColors[m].length; p++) {
					if (data[i+p] != this.matchColors[m][p]) {
						matched = false;
						break;
					}
				}
				if (matched) {
					for (var p=0; p<this.substituteColors[m].length; p++) {
						data[i+p] = this.substituteColors[m][p];
					}
					
					n++;

					break;
				}

			}
		}
		//console.log("ColorSubstitutionFilter: swapped " + n + " of " + (width*height) + " pixels");
		imageData.data = data;
		targetCtx.putImageData(imageData, targetX, targetY);
		return true;
	}

	p.toString = function() {
		return "[ColorSubstitutionFilter]";
	}

	/**
	 * Returns a clone of this ColorSubstitutionFilter instance.
	 * @method clone
	 * @return {ColorSubstitutionFilter} A clone of the current ColorSubstitutionFilter instance.
	 **/
	p.clone = function() {
		return new ColorSubstitutionFilter(this.matchColors, this.substituteColors);
	}

	createjs.ColorSubstitutionFilter = ColorSubstitutionFilter;

}());