/*\
title: $:/eberron-tw/action-roui.js
type: application/javascript
module-type: widget

Action widget to generate a list of patches for the item Robe of Useful Items.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

//https://stackoverflow.com/a/1031779
function c(s,m,n,f,a){m=parseInt(m);if(isNaN(m))m=1;n=parseInt(n);if(isNaN(n))n=1;f=parseInt(f);a=typeof(a)=='string'?parseInt(a.replace(/\s/g,'')):0;if(isNaN(a))a=0;var r=0;for(var i=0;i<n;i++)r+=Math.floor(Math.random()*f+1);return r*m+a;};
function diceparse(d){return c.apply(this,d.match(/(?:(\d+)\s*\*\s*)?(\d*)d(\d+)(?:\s*([\+\-]\s*\d+))?/i));}

var ROUIWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ROUIWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ROUIWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ROUIWidget.prototype.execute = function() {
	this.actionTiddler = this.getVariable("currentTiddler");
	this.actionField = this.getAttribute("$field","patches");
	var num = diceparse(this.getAttribute("$number","4d4"),10);
    var varnum = parseInt(this.getAttribute("$varnum","12"),10); //starting variable name for checkboxes
    if (isNaN(num)){ num=parseInt(this.getAttribute("$number","1"),10); }
    if (isNaN(num)){ num=1; }
    if (isNaN(varnum)){ varnum=1; }
	var dataTiddler = this.getAttribute("$dataTiddler","$:/RobeOfUsefulItemsTable");

	var data = this.wiki.getTiddlerData(dataTiddler,{});
    var picks = [];

    for(let i=1; i<=num; i++){
        var index = Math.floor(Math.random()*Object.keys(data).length + 1);
        picks.push(data[index]);
    }

    this.actionValue = "<table border='0'>";

	picks.forEach((pick) => {
        varnum++;
        if (pick.includes("spell scroll, tier 2")){
            var spelltiddlers = this.wiki.filterTiddlers("[[spell school]tagging[]tagging[]category[spell]tier[2]]", this);
            var randomspell = spelltiddlers[Math.floor(Math.random()*spelltiddlers.length)];
            pick = pick+" ([["+randomspell+"]])";
        }
        this.actionValue += "<tr><td><$checkbox field='var"+varnum+"' checked='yes' default='no'/></td><td>"+pick+"</td></tr>";
	});
    this.actionValue += "</table>"

};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ROUIWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$dataTiddler"] || changedAttributes["$number"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ROUIWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(typeof this.actionValue === "string") {
    	this.wiki.setText(this.actionTiddler,this.actionField,null,this.actionValue);
    }
	return true; // Action was invoked
};

exports["action-roui"] = ROUIWidget;

})();
