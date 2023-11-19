/*\
title: $:/eberron-tw/filters/firstlevenshtein.js
type: application/javascript
module-type: filteroperator

Return the single closest levenshtein result for an operand. Case insensitive.

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    const levenshteinDistance = (s, t) => {
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const arr = [];
        for (let i = 0; i <= t.length; i++) {
            arr[i] = [i];
            for (let j = 1; j <= s.length; j++) {
                arr[i][j] =
                    i === 0
                        ? j
                        : Math.min(
                            arr[i - 1][j] + 1,
                            arr[i][j - 1] + 1,
                            arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
                        );
            }
        }
        return arr[t.length][s.length];
    };

    exports.firstlevenshtein = function (source, operator, options) {
        const term = operator.operand.slice(0,20).toLowerCase();
        if (term.length < 3) return [""];
        let result = "";
        let lowestLevScore = 1000;
        source(function (tiddler, title) {
            if (lowestLevScore < 2 || title.length > term.length + lowestLevScore || title.length < term.length - lowestLevScore) return;
            const titleLC = title.toLowerCase();
            const levScore = levenshteinDistance(titleLC, term);
            if (levScore < lowestLevScore) {
                result = title;
                lowestLevScore = levScore;
            }
        });
        return [result];
    };

})();