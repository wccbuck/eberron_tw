/*\
title: $:/eberron-tw/filters/maincreaturetype.js
type: application/javascript
module-type: filteroperator

If a tiddler has category = "creature", look at the tags and return the most notable creature type.

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    const creatureTypes = ['ooze', 'plant creature', 'celestial', 'elemental', 'fiend', 'giant', 'fey', 'aberration', 'undead', 'construct', 'beast', 'monstrosity', 'dragon', 'immortal', 'humanoid', 'manifestation'];

    exports.maincreaturetype = function (source, operator, options) {
        let results = [];
        source(function (tiddler, title) {
            if (!tiddler || !tiddler.fields || tiddler.fields.category !== "creature" || !tiddler.fields.tags) {
                results.push("--");
            } else {
                let result = "--";
                for (const creatureType of creatureTypes) {
                   if (tiddler.fields.tags.includes(creatureType)) {
                       result = creatureType;
                       break;
                   }
                }
                results.push(result);
            }
        });
        return results;
    };

})();