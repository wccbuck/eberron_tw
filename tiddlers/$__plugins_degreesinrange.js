/*\
title: $:/core/modules/filters/degreesinrange.js
type: application/javascript
module-type: filteroperator

Filter operator that takes a degree value and converts it to a value within range (assumed to be -180 to 180, but the operand can specify a starting degree).

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.degreesinrange = makeNumericBinaryOperator(
    function(a,b) {
        var startDegree = b || -180;
        var endDegree = startDegree + 360;
        var result = a;
        while(result < startDegree) {
             result = result + 360;
        }
        while(result >= endDegree) {
             result = result - 360;
        }
        return result;
    }
);

function makeNumericBinaryOperator(fnCalc) {
	return function(source,operator,options) {
		var result = [],
			numOperand = $tw.utils.parseNumber(operator.operand);
		source(function(tiddler,title) {
			result.push($tw.utils.stringifyNumber(fnCalc($tw.utils.parseNumber(title),numOperand)));
		});
		return result;
	};
};


})();