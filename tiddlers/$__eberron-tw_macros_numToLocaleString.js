/*\
title: $:/eberron-tw/macros/numToLocaleString.js
type: application/javascript
module-type: macro

Get localeString of number (add commas)

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Information about this macro
*/

exports.name = "ntls";

exports.params = [{name: "locale", default:"en-US"}, {name: "field", default:"population"}];

/*
Run the macro
*/
exports.run = function(locale, field) {
    var title = this.getVariable("currentTiddler");
    var tiddler = this.wiki.getTiddler(title);
    var num = parseInt(tiddler.getFieldString(field)) || "—";
    return num.toLocaleString(locale);
};

})();
