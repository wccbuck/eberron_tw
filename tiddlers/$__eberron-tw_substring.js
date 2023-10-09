/*\
title: $:/core/modules/macros/substring.js
type: application/javascript
module-type: macro

Get a substring of a string

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "substring";

exports.params = [{name: "indexStart", default:"0"}, {name: "indexEnd", default:"0"}];

/*
Run the macro
*/
exports.run = function(indexStart, indexEnd) {
    var tiddler = this.getVariable("currentTiddler");
    if (indexEnd == "0") {return tiddler.substring(indexStart);}
    else {return tiddler.substring(indexStart, indexEnd);}
};

})();
