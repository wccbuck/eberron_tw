/*\
title: $:/plugins/wccbuck/action-scroll-to-header.js
type: application/javascript
module-type: widget

Action widget to scroll the page to a chosen header on a specific tiddler in the story view (if able).

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ScrollToHeaderWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ScrollToHeaderWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ScrollToHeaderWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
ScrollToHeaderWidget.prototype.execute = function() {
	this.actionTo = this.getAttribute("$to");
	this.actionHeader = this.getAttribute("$header");
	//this.actionScroll = this.getAttribute("$scroll");
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
ScrollToHeaderWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$to"] || changedAttributes["$header"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
ScrollToHeaderWidget.prototype.invokeAction = function(triggeringWidget,event) {
	event = event || {};
	var bounds = triggeringWidget && triggeringWidget.getBoundingClientRect && triggeringWidget.getBoundingClientRect(),
		suppressNavigation = event.metaKey || event.ctrlKey || (event.button === 1);
	var navigateTo = this.actionTo === undefined ? this.getVariable("currentTiddler") : this.actionTo;

	this.dispatchEvent({
		type: "tm-navigate",
		navigateTo: navigateTo,
		navigateFromTitle: this.getVariable("storyTiddler"),
		navigateFromNode: triggeringWidget,
		navigateFromClientRect: bounds && { top: bounds.top, left: bounds.left, width: bounds.width, right: bounds.right, bottom: bounds.bottom, height: bounds.height
		},
		navigateFromClientTop: bounds && bounds.top,
		navigateFromClientLeft: bounds && bounds.left,
		navigateFromClientWidth: bounds && bounds.width,
		navigateFromClientRight: bounds && bounds.right,
		navigateFromClientBottom: bounds && bounds.bottom,
		navigateFromClientHeight: bounds && bounds.height,
		navigateSuppressNavigation: true,
		metaKey: event.metaKey,
		ctrlKey: event.ctrlKey,
		altKey: event.altKey,
		shiftKey: event.shiftKey,
		event: event
	});

	var duration = parseInt(this.wiki.getTiddlerText("$:/config/AnimationDuration"))/2 || 200;
	var actionHeader = this.actionHeader;
    setTimeout(function() {
		try {

		    var thisStory = triggeringWidget.getVariable("tv-story-list");
            var tiddlerDiv;
            if (thisStory !== "$:/StoryList"){
                tiddlerDiv = document.querySelector('section.tc-story-river.tc-storytwo-river div[data-tiddler-title="' + navigateTo + '"]');
            } else {
                tiddlerDiv = document.querySelector('section.tc-story-river:not(.tc-storytwo-river) div[data-tiddler-title="' + navigateTo + '"]');
            }

			var headers = tiddlerDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");
			var foundHeader;
			for (let i = 0; i < headers.length; i++){
				var header = headers[i]
				if (actionHeader && header.innerText.toLowerCase() == actionHeader.toLowerCase()){
					foundHeader = header;
					break;
				}
			}
			if (foundHeader) {
				foundHeader.scrollIntoView({behavior: "smooth"});
				// var titlebar = document.querySelector('[data-tiddler-title="' + navigateTo + '"] div.tc-tiddler-title');
				// var scrollOffset = titlebar.offsetHeight + 35;
				//
				// window.scroll({
				// 	top: foundHeader.offsetTop + window.pageYOffset - scrollOffset,
				// 	behavior: 'smooth'
				// });
			}
		} catch {}
	}, duration);

	return true; // Action was invoked
};

exports["action-scroll-to-header"] = ScrollToHeaderWidget;

})();
