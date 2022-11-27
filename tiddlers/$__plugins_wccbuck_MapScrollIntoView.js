/*\
title: $:/plugins/wccbuck/MapScrollIntoView.js
type: application/javascript
module-type: widget

Scroll Map into view

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MapScrollIntoView = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MapScrollIntoView.prototype = new Widget();

/*
Render this widget into the DOM
*/
MapScrollIntoView.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
    this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
MapScrollIntoView.prototype.execute = function() {
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MapScrollIntoView.prototype.refresh = function(changedTiddlers) {
    return false;
};

/*
Invoke the action associated with this widget
*/
MapScrollIntoView.prototype.invokeAction = function(triggeringWidget,event) {
	try {
		setTimeout(function(){
			var mapElement = this.document.getElementById('map-scroll-position');
			if(mapElement){
				mapElement.scrollIntoView({behavior: "smooth"});
			}
		}, 100);
	} catch {
		console.log("couldn't scroll map into view");
	}
    return true; // Action was invoked
};

exports.mapscrollintoview = MapScrollIntoView;

})();
