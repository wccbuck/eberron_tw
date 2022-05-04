/*\
title: $:/plugins/MoonPhase.js
type: application/javascript
module-type: widget

Display phases of eberron's moons

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var MoonPhase = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MoonPhase.prototype = new Widget();

/*
Render this widget into the DOM
*/
MoonPhase.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
    this.computeAttributes();
	this.execute();
    this.moon = this.getAttribute("moon","Zarantyr");
	this.day = parseInt(this.getAttribute("day", "0"));
    var moondata = this.wiki.getTiddlerData("$:/MoonData")

    var svg = this.document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width', '80%');
    svg.setAttribute('height', '80%');
    svg.setAttribute('viewBox', '0 0 150 150');
    var moonLight = this.document.createElementNS('http://www.w3.org/2000/svg','circle');
    moonLight.setAttribute('cx','75');
    moonLight.setAttribute('cy','75');
    moonLight.setAttribute('r','70');
    moonLight.setAttribute('fill','#'+moondata[this.moon]['color']);
    moonLight.setAttribute('stroke','#000');
    moonLight.setAttribute('stroke-width','1.5');
    svg.appendChild(moonLight);
	if (this.moon == "Lharvion"){
		var lharvionChasm = this.document.createElementNS('http://www.w3.org/2000/svg','path');
		lharvionChasm.setAttribute('d', 'M 75 25 A 150 150 0 0 1 75 125 A 150 150 0 0 1 75 25');
		lharvionChasm.setAttribute('fill','#000');
		lharvionChasm.setAttribute('style','opacity:0.5;');
		svg.appendChild(lharvionChasm);
	}
	var mdd = getMoonDarkD(moondata, this.moon, this.day);
	var moonDark = this.document.createElementNS('http://www.w3.org/2000/svg','path');
	moonDark.setAttribute('d', mdd);
	moonDark.setAttribute('fill','#000');
	moonDark.setAttribute('style','opacity:0.7;');
	svg.appendChild(moonDark);
	parent.insertBefore(svg,nextSibling);
	this.renderChildren(svg,null);
	this.domNodes.push(svg);
};

function getMoonDarkD(moondata, moonname, day){
	var startPhase = moondata[moonname]['startphase'];
	var period = moondata[moonname]['period'];
	var pct = (100.0*(startPhase+day)/period)%100;
	if (moonname != "Lharvion"){
		pct = 100-pct;
	}
	var sweep1 = 0, sweep2 = 1;
    var p = 1 - (pct % 25)/25.0
    if (pct >= 25 && pct < 50){
      sweep1 = 0;
      sweep2 = 0;
      p = 1-p;
    }
    if (pct >= 50 && pct < 75){
      sweep1 = 1;
      sweep2 = 1;
    }
    if (pct >= 75 && pct < 100){
      sweep1 = 1;
      sweep2 = 0;
      p = 1-p;
    }
    var radius = Math.min(Number.MAX_SAFE_INTEGER, 70*((p*p + 1)/(2*p)))
    return `M 75 5
            A 70 70 0 0 ${sweep1} 75 145
            A ${radius} ${radius} 0 0 ${sweep2} 75 5`;
}

/*
Compute the internal state of the widget
*/
MoonPhase.prototype.execute = function() {

};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MoonPhase.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
    if(changedAttributes["moon"] || changedAttributes["day"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports.moonphase = MoonPhase;

})();
