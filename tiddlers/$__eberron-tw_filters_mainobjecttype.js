/*\
title: $:/eberron-tw/filters/mainobjecttype.js
type: application/javascript
module-type: filteroperator

If a tiddler has category = "object", look at the tags and return the most notable object type.

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    const objectTypes = ['drug', 'poison', 'vehicle', 'scroll', 'equipment pack', 'food', 'material', 'potion', 'magical implement', 'armor', 'weapon', 'accessory', 'tool'];

    exports.mainobjecttype = function (source, operator, options) {
        let results = [];
        source(function (tiddler, title) {
            if (!tiddler || !tiddler.fields || tiddler.fields.category !== "object" || !tiddler.fields.tags) {
                results.push("--");
            } else {
                let result = "--";
                for (const objectType of objectTypes) {
                   if (tiddler.fields.tags.includes(objectType)) {
                       result = objectType;
                       break;
                   }
                }
                results.push(result);
            }
        });
        return results;
    };

})();