/*\
title: $:/eberron-tw/CharSheetField.js
type: application/javascript
module-type: widget

A double-click-to-edit field for the character sheet

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CharSheetField = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CharSheetField.prototype = new Widget();

/*
Render this widget into the DOM
*/
CharSheetField.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
    this.computeAttributes();
	this.execute();
    this.tid = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
    this.field = this.getAttribute("field","text");
    this.revealfield = this.getAttribute("revealfield", "reveal_".concat(this.field));
    var csf = this;
    parent.addEventListener("dblclick",function(event) {
        csf.wiki.setText(csf.tid, csf.revealfield, undefined, "show");
        setTimeout(() => { try{ var div = csf.document.getElementById("div_".concat(csf.field)); div.getElementsByTagName("input")[0].focus();} catch(error) {} }, 10);
    });
};

/*
Compute the internal state of the widget
*/
CharSheetField.prototype.execute = function() {

};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
CharSheetField.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
    if(changedAttributes["tid"] || changedAttributes["field"] || changedAttributes["revealfield"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports.charsheetfield = CharSheetField;

})();