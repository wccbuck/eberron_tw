/*\
title: $:/core/modules/widgets/action-chooserandom.js
type: application/javascript
module-type: widget

Action widget to select a random tiddler from those matching the supplied filter.  Result is written to the specified output tiddler's specified field. (Alternatively, if nav=true, navigate to the randomly chosen tiddler.)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function checkData(array, data, value) {
	for (var i =0 ; i < array.length; i++) {
		if (data[array[i]] == value){
			return true;
		}
	}
	return false;
}

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ChooseRandomWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ChooseRandomWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ChooseRandomWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ChooseRandomWidget.prototype.execute = function() {
	this.actionFilter = this.getAttribute("$filter","[is[tiddler]]" );
    var append = this.getAttribute("$append");
    if(append){
        this.actionFilter = this.actionFilter + " +[remove["+append+"]]";
    }
	this.actionTiddler = this.getAttribute("$tiddler",this.getVariable("currentTiddler"));
	this.actionField = this.getAttribute("$field","text");
	this.actionIndex = this.getAttribute("$index");
    this.nav = this.getAttribute("$nav", "false");
	var num = this.getAttribute("$number","1");
	var opt = this.getAttribute("$opt","none");
	var replace = this.getAttribute("$replace","false");
	var dataTiddler = this.getAttribute("$dataTiddler","false");
	var unique = this.getAttribute("$unique","false");

	var tiddlers = [];
	var data = this.wiki.getTiddlerData(dataTiddler,{});
	if(dataTiddler !="false"){
		this.actionFilter = "[["+dataTiddler+"]indexes[]]";
	}
	tiddlers = this.wiki.filterTiddlers(this.actionFilter,this);
	shuffleArray(tiddlers);
	var numpicks = parseInt(num,10);
	if(isNaN(numpicks)){
		numpicks=1;}
	if(replace=="false") {
		numpicks=Math.min(numpicks,tiddlers.length);}
	var picks=[];
	while(numpicks>0 && tiddlers.length>0){
		if(replace=="false"){
			var tid = tiddlers.pop();
			if(unique !="false" && dataTiddler !="false"){

				if(checkData(picks, data, data[tid])){
					continue;
				}
			}
			picks.push(tid);
		}
		else{
			picks.push(tiddlers[0]);
			shuffleArray(tiddlers);
		}
		numpicks--;}
	this.actionValue = append; //space-separated starting list
    if(this.actionValue){
        this.actionValue = this.actionValue+" ";
    } else {
        this.actionValue = "";
    }
    var remove = this.getAttribute("$remove");
    var endString = "";
    if(remove){
        var avSplit = (" "+this.actionValue).split(" "+remove+" ");
        this.actionValue = (avSplit[0]+" ").trimStart();
        endString = avSplit[1];
    }
	picks.forEach((pick) => {
		var tid = pick;
		if(dataTiddler !="false"){
			tid = data[pick];
		}
		switch(opt){
		case "link-br":
			this.actionValue += "[["+tid+"]]<br>\n"; break;
		case "br":
			this.actionValue += tid +"<br>\n"; break;
		case "hashes":
		case "comma":
			this.actionValue += tid +"###"; break;
		case "none":
		default:
			this.actionValue += tid +" "; break;
		}
	})
	this.actionValue = (this.actionValue + endString).trim();
	if(opt=="comma"){
		this.actionValue = this.actionValue.replace(/###/g,", ").slice(0,-2);}

};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ChooseRandomWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$filter"] || changedAttributes["$tiddler"] || changedAttributes["$field"] || changedAttributes["$number"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ChooseRandomWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(typeof this.actionValue === "string") {
    	if(this.nav == "true"){
            var story = new $tw.Story();
            story.navigateTiddler(this.actionValue);
        } else {
	    	this.wiki.setText(this.actionTiddler,this.actionField,this.actionIndex,this.actionValue);
        }
    }
	return true; // Action was invoked
};

exports["action-chooserandom"] = ChooseRandomWidget;

})();
