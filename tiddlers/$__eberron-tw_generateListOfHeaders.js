/*\
title: $:/eberron-tw/generateListOfHeaders.js
type: application/javascript
module-type: widget

Generate and copy to clipboard a suggested list of headers for this tiddler, with scrollToHeader links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ListOfHeadersWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ListOfHeadersWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ListOfHeadersWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ListOfHeadersWidget.prototype.execute = function() {
	this.actionTiddler = this.getAttribute("$tiddler", this.getVariable("currentTiddler"));
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ListOfHeadersWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ListOfHeadersWidget.prototype.invokeAction = function(triggeringWidget,event) {
    try {
        var tiddlerDiv = document.querySelector('[data-tiddler-title="'+this.actionTiddler+'"]');
        var headers = tiddlerDiv.querySelectorAll("h1, h2, h3");
        var bulletString = "!! Links to Headers\n";
        var bullet;
        for (let i = 1; i < headers.length; i++){if(headers[i].tagName == "H3"){bullet="**";}else{bullet="*";} bulletString+=bullet+' <<scrollToHeader "'+headers[i].innerText+'">>\n'};
        console.log(bulletString);
        navigator.clipboard.writeText(bulletString);
    } catch {}
	return true; // Action was invoked
};

exports["generateListOfHeaders"] = ListOfHeadersWidget;

})();
