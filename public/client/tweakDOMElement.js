// fixing createjs.DOMElement in place because it can't be extended using createjs inheritance style

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
	

