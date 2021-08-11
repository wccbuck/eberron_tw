/*\
title: $:/filter/substring.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the first n characters

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.substring = function(source,operator,options) {
    var results = [];
    source(function(tiddler,title) {
        if(title) {
            var value = title.substring(0, Number(operator.operand));
            if(value) {
                results.push(value);
            }
        }
    });
    return results;
};

})();

