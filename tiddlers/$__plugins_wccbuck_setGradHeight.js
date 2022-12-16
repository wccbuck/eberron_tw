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
    	    var newTop= String(titlebar.offsetHeight + 27) + "px";
        
            var titlegradient = document.querySelector("div[data-tiddler-title=\""+self.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.title-gradient");
            if (titlegradient) titlegradient.style.top = newTop;
        } catch(err) {
            console.log(err);
        }
    }, 10);
}

/*
Run the macro
*/
exports.run = function() {
    var titlebar = document.querySelector("div[data-tiddler-title=\""+this.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.tc-tiddler-title");
    var self = this;
    setheight(self, titlebar);
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        setheight(self, titlebar);
      }
    });

    ro.observe(titlebar);
};

})();
