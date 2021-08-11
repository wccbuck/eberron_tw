/*\
title: $:/plugins/ProgressClock.js
type: application/javascript
module-type: widget

Clickable progress clock

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ProgressClock = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ProgressClock.prototype = new Widget();

/*
Render this widget into the DOM
*/
ProgressClock.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
    this.computeAttributes();
	this.execute();
    this.segments = this.getAttribute("segments","2");
    this.tiddler = this.getAttribute("tiddler");
    if(!this.segments) {this.segments="2"};
    var filledSegments = parseInt(this.getAttribute("filled", "0"));
    if(this.tiddler) {
        var tidtext = this.wiki.getTiddlerText(this.tiddler);
        if(!tidtext) {tidtext = 0;}
        filledSegments = parseInt(tidtext);
    }
    var svg = this.document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width', '80%');
    svg.setAttribute('height', '80%');
    svg.setAttribute('viewBox', '0 0 70 70');
    var piechart = this.document.createElementNS('http://www.w3.org/2000/svg','circle');
    piechart.setAttribute('cx','35');
    piechart.setAttribute('cy','35');
    piechart.setAttribute('r','15.9155');
    piechart.setAttribute('fill','transparent');
    piechart.setAttribute('stroke','#D65618');
    piechart.setAttribute('stroke-width','30');
    var percentage = Math.round(1000*(100.0*filledSegments/this.segments))/1000.0;
    piechart.setAttribute('stroke-dasharray',percentage.toString()+' '+(100-percentage).toString());
    piechart.setAttribute('stroke-dashoffset','25');
    svg.appendChild(piechart);
    var group = this.document.createElementNS('http://www.w3.org/2000/svg','g');
    group.setAttribute('stroke', 'black');
    var chartStroke = Math.round(100*(3.1429 - 0.071429*(this.segments)))/100.0;
    group.setAttribute('stroke-width', chartStroke.toString());
    group.setAttribute('fill', 'transparent');
    svg.appendChild(group);
    var circle = this.document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx','35');
    circle.setAttribute('cy','35');
    circle.setAttribute('r','31.831');
    group.appendChild(circle);
    for (let i=0; i<this.segments; i++){
        var line = this.document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1','35');
        line.setAttribute('y1','35');
        var x2 = Math.round(1000*(35 - 32*Math.sin(2*Math.PI*i/this.segments)))/1000.0;
        var y2 = Math.round(1000*(35 - 32*Math.cos(2*Math.PI*i/this.segments)))/1000.0;
        line.setAttribute('x2',x2.toString());
        line.setAttribute('y2',y2.toString());
        group.appendChild(line);
    }

    var self = this;
    svg.addEventListener("dblclick",function(event) {
        filledSegments = Math.min(filledSegments+1, self.segments);
        self.wiki.setText(self.tiddler, "text", undefined, filledSegments.toString());
        percentage = Math.round(1000*(100.0*filledSegments/self.segments))/1000.0;
        piechart.setAttribute('stroke-dasharray',percentage.toString()+' '+(100-percentage).toString());
    });
    parent.insertBefore(svg,nextSibling);
	this.renderChildren(svg,null);
	this.domNodes.push(svg);
};

/*
Compute the internal state of the widget
*/
ProgressClock.prototype.execute = function() {

};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ProgressClock.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
    if(changedAttributes["segments"] || changedAttributes["tiddler"] || changedAttributes["filled"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports.progressclock = ProgressClock;

})();
