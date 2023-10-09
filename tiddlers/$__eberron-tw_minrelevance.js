/*\
title: $:/core/modules/filters/minrelevance.js
type: application/javascript
module-type: filteroperator

Filter operator for filtering out tiddlers that don't meet the minimum relevance in the operand

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.minrelevance = function(source,operator,options) {
	var results = [],
		minLength = parseInt(operator.operand || "",0) || 0,
        reverse = false;
    if(operator.prefix === "!"){
        reverse = true;
    }
	source(function(tiddler,title) {
        var bl = options.wiki.getTiddlerBacklinks(title);
        var tags = options.wiki.getTiddlersWithTag(title);
        var array = bl.concat(tags);
        array = [ ...new Set(array) ];
        var lnx = array.length * 500;
        var txt = 0;
        if(options.wiki.getTiddlerText(title)){
            txt = options.wiki.getTiddlerText(title).length;
        }
        var rel = lnx + txt;

        if(!reverse){
    		if(rel >= minLength) {
    			results.push(title);
    		}
        }else{
            if(rel < minLength) {
                results.push(title);
            }
        }
	});
	return results;
};

})();