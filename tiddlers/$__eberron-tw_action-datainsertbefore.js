/*\
title: $:/eberron-tw/action-datainsertbefore.js
type: application/javascript
module-type: widget

Action widget to move a key/value pair in a datatiddler and insert it before a different key/value pair. 

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataInsertBeforeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataInsertBeforeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataInsertBeforeWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DataInsertBeforeWidget.prototype.execute = function() {
	this.tiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.targetIndex = this.getAttribute("$targetIndex");
	this.actionIndex = this.getAttribute("$actionIndex");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";

    var oldText = this.wiki.getTiddlerText(this.tiddler);
    var lines = oldText.split('\n');
    var oldIndex = 0;
    var newIndex = -1;
    for (var i=0; i < lines.length; i++){
        if (lines[i].startsWith(this.targetIndex+': ')){ newIndex = i;}
        if (lines[i].startsWith(this.actionIndex+': ')){ oldIndex = i;}
    }
    if (oldIndex < newIndex) {newIndex -= 1;}
    if (newIndex==-1) {newIndex = lines.length-1;}
    lines.splice(newIndex, 0, lines.splice(oldIndex, 1)[0]);
    this.newText = lines.join('\n');
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DataInsertBeforeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$targetIndex"] || changedAttributes["$actionIndex"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DataInsertBeforeWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		options = {};
	options.suppressTimestamp = !this.actionTimestamp;
	if((typeof this.targetIndex == "string") || (typeof this.actionIndex == "string")) {
		this.wiki.setText(this.tiddler,"text",undefined,this.newText,options);
	}
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			self.wiki.setText(self.tiddler,"text",undefined,attribute,options);
		}
	});
	return true; // Action was invoked
};

exports["action-datainsertbefore"] = DataInsertBeforeWidget;

})();
