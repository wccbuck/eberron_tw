/*\
title: $:/plugins/wccbuck/setGradHeight.js
type: application/javascript
module-type: macro

Macro to get the height of the title bar

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "setGradHeight";

exports.params = [];

function setheight(self, titlebar){
    setTimeout(() => {
        try{
            let newTop, headerScrollMarginTop, titlegradient, tiddlerDiv;
            const thisStory = self.getVariable("tv-story-list");
            if (thisStory !== "$:/StoryList"){
                tiddlerDiv = document.querySelector("section.tc-story-river.tc-storytwo-river div[data-tiddler-title=\""+self.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"]");
                titlegradient = tiddlerDiv.querySelector("div.title-gradient");
                if (!titlebar || !titlebar.offsetHeight){
                    titlebar = tiddlerDiv.querySelector("div.tc-tiddler-title");
                }
                newTop= String(titlebar.offsetHeight + 13) + "px";
                headerScrollMarginTop = String(titlebar.offsetHeight + 26) + "px";
            } else {
                tiddlerDiv = document.querySelector("section.tc-story-river:not(.tc-storytwo-river) div[data-tiddler-title=\""+self.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"]");
                titlegradient = tiddlerDiv.querySelector("div.title-gradient");
                if (!titlebar || !titlebar.offsetHeight){
                    titlebar = tiddlerDiv.querySelector("div.tc-tiddler-title");
                }
                newTop= String(titlebar.offsetHeight + 27) + "px";
                headerScrollMarginTop = String(titlebar.offsetHeight + 40) + "px";
            }
    	    
            if (titlegradient) titlegradient.style.top = newTop;
            if (tiddlerDiv && headerScrollMarginTop) {
                const headers = tiddlerDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");
                for (let i = 1; i < headers.length; i++){
                    headers[i].style.scrollMarginTop = headerScrollMarginTop;
                }
            }
        } catch(err) {
            console.log(err);
        }
    }, 50);
    return titlebar.offsetHeight;
}

/*
Run the macro
*/
exports.run = function() {
    let titlebar;
    const self = this;
    const thisStory = self.getVariable("tv-story-list");
    if (thisStory !== "$:/StoryList"){
        titlebar = document.querySelector("section.tc-story-river.tc-storytwo-river div[data-tiddler-title=\""+this.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.tc-tiddler-title");
    } else {
        titlebar = document.querySelector("section.tc-story-river:not(.tc-storytwo-riverdiv) [data-tiddler-title=\""+this.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.tc-tiddler-title");
    }
    let titlebarHeight = setheight(self, titlebar);
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (titlebar.offsetHeight !== titlebarHeight){
            titlebarHeight = setheight(self, titlebar);
        }
      }
    });

    ro.observe(titlebar);
};

})();
