/*\
title: $:/plugins/wccbuck/action-dataremove.js
type: application/javascript
module-type: widget

Action widget to remove a key/value pair from a datatiddler without sorting it. Action-setfield widget does the same thing except it sorts indexes.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataRemoveWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataRemoveWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataRemoveWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DataRemoveWidget.prototype.execute = function() {
	this.tiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.index = this.getAttribute("$index");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";

    var oldText = this.wiki.getTiddlerText(this.tiddler);
    var lines = oldText.split('\n');
    for (var i=0; i < lines.length; i++){
        if (lines[i].startsWith(this.index+': ')){ lines.splice(i, 1); break;}
    }
    this.newText = lines.join('\n');
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DataRemoveWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$index"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DataRemoveWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		options = {};
	options.suppressTimestamp = !this.actionTimestamp;
	if((typeof this.index == "string")) {
		this.wiki.setText(this.tiddler,"text",undefined,this.newText,options);
	}
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			self.wiki.setText(self.tiddler,"text",undefined,attribute,options);
		}
	});
	return true; // Action was invoked
};

exports["action-dataremove"] = DataRemoveWidget;

})();
