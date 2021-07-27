/*\
title: $:/core/modules/macros/setGradHeight.js
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

/*
Run the macro
*/
exports.run = function() {
        try{

        var titlebar = document.querySelector("div[data-tiddler-title=\""+this.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.tc-tiddler-title");

        setTimeout(() => { 
    	    var newTop= String(titlebar.offsetHeight + 27) + "px";
        
            var titlegradient = document.querySelector("div[data-tiddler-title=\""+this.getVariable("currentTiddler").replaceAll('"', '\\"')+"\"] div.title-gradient");
            titlegradient.style.top = newTop;
        }, 10);


    } catch(err) {
        console.log(err);
    }
};

})();
