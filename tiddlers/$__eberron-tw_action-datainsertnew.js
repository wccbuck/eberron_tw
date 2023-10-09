/*\
title: $:/eberron-tw/action-datainsertnew.js
type: application/javascript
module-type: widget

Action widget to add a key/value pair to the end of a datatiddler without sorting it. Action-setfield widget does the same thing except it sorts indexes.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var DataInsertNewWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DataInsertNewWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DataInsertNewWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
DataInsertNewWidget.prototype.execute = function() {
	this.tiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.newIndex = this.getAttribute("$newIndex");
	this.newValue = this.getAttribute("$newValue");
	this.actionTimestamp = this.getAttribute("$timestamp","yes") === "yes";

    var newLine = this.newIndex+": "+this.newValue
    var oldText = this.wiki.getTiddlerText(this.tiddler);
    if(oldText) {oldText = oldText + "\n";}
    else {oldText="";}
    this.newText = oldText+newLine;
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
DataInsertNewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$tiddler"] || changedAttributes["$newIndex"] || changedAttributes["$newValue"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
DataInsertNewWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var getTid = this.wiki.getTiddler(this.tiddler);
    var tidType = "";
    if (getTid){tidType = getTid.getFieldString("type");}
    if (tidType !="application/x-tiddler-dictionary"){
        this.wiki.setText(this.tiddler,"type",undefined,"application/x-tiddler-dictionary",undefined);
    }
    var self = this,
		options = {};
	options.suppressTimestamp = !this.actionTimestamp;
	if((typeof this.newIndex == "string") || (typeof this.newValue == "string")) {
		this.wiki.setText(this.tiddler,"text",undefined,this.newText,options);
	}
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			self.wiki.setText(self.tiddler,"text",undefined,attribute,options);
		}
	});
	return true; // Action was invoked
};

exports["action-datainsertnew"] = DataInsertNewWidget;

})();
