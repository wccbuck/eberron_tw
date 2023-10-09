/*\
title: $:/eberron-tw/indexesunsorted.js
type: application/javascript
module-type: filteroperator

Filter operator for returning the indexes of a data tiddler. Unsorted.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.indexesunsorted = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
        var text = options.wiki.getTiddlerText(title);
        if(text){
        var lines = options.wiki.getTiddlerText(title).split('\n');
        for(var i=0; i < lines.length; i++){
            var linesplit = lines[i].split(': ');
            results.push(linesplit[0]);
        }
        }
	});
	return results;
};

})();
