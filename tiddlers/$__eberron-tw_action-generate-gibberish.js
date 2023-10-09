/*\
title: $:/eberron-tw/action-generate-gibberish.js
type: application/javascript
module-type: widget

Action widget to generate gibberish for different fictional languages

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    function charIsAlphabetical(c) {
        return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'));
    }

    function charIsVowel(c) {
        return ("aeiouyAEIOUY".indexOf(c) != -1);
    }

    function charIsUpper(c) {
        return (c.toUpperCase() === c && c.toLowerCase() !== c);
    }

    function charsAreSameType(c, p) {
        return (charIsVowel(c) && charIsVowel(p)) || (!charIsVowel(c) && !charIsVowel(p));
    }

    function charsAreBothAlphOrBothNotAlph(c, p) {
        return (charIsAlphabetical(c) && (!p || charIsAlphabetical(p))) ||
            (!charIsAlphabetical(c) && (!p || !charIsAlphabetical(p)))
    }

    function hasRepeats(str) {
        return (/([a-zA-Z])\1+/).test(str);
    }

    function removeDoubleLetters(str) {
        let newString = [...str].reduce((accumulator, value, i, array) => {
            if (value === array[i + 1]) return accumulator;
            return accumulator + value;
        }, "");
        return newString;
    }

    function removeTripleLetters(str) {
        let newString = [...str].reduce((accumulator, value, i, array) => {
            if (i + 2 < array.length && value === array[i + 1] && value === array[i + 2]) return accumulator;
            return accumulator + value;
        }, "");
        return newString;
    }

    function allInputCharsAreInConsonantList(wordBlock, consonantBlocks) {
        const allchars = consonantBlocks.join("");
        return [...wordBlock].every(c => allchars.includes(c.toLowerCase()));
    }

    function digitalSum(n, base) {
        if (base === 1) return 0;
        let total = 0;
        while (n > 0) {
            total = total + (n % base);
            n = Math.floor(n / base);
        }
        return total;
    }

    function digitalRoot(n, base) {
        if (base === 10) {
            return n % 9 || 9;
        }
        if (base < 2) {
            return 1;
        }
        while (n >= base) {
            n = digitalSum(n, base);
        }
        return n;
    }

    function hashCode(str) {
        if (!str) {
            return 1;
        }
        let hash = 0;
        for (let i = 0, len = str.length; i < len; i++) {
            let chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function translate(text, language, dictionary, vowels, cons, scrambling, sharedLang1, sharedCons1, sharedLang2, sharedCons2, commonPct, lengthPctCutoff, stopRecursion = false) {
        let currentLetter = "";
        let prevLetter = "";
        let nextLetter = "";
        let translatedText = "";

        let wordsAndDelimiters = [];
        let currentWord = "";

        for (let i = 0; i < text.length; i++) {
            currentLetter = text.charAt(i);
            if (charsAreBothAlphOrBothNotAlph(currentLetter, prevLetter)) {
                currentWord = currentWord.concat(currentLetter);
            } else {
                wordsAndDelimiters.push(currentWord);
                currentWord = currentLetter;
            }
            if (i === text.length - 1 && currentWord) {
                wordsAndDelimiters.push(currentWord);
            }
            prevLetter = currentLetter;
        }
        for (let word of wordsAndDelimiters) {
            if (!word || !charIsAlphabetical(word[0])) {
                translatedText = translatedText.concat(word);
                continue;
            } else {
                let translatedWord = "";
                let capitalizeFirst = charIsUpper(word[0]);

                if (Object.keys(dictionary).includes(word.toLowerCase())) {
                    // this word already has a translation in the canon language
                    translatedWord = dictionary[word.toLowerCase()];
                    if (capitalizeFirst) {
                        translatedWord = translatedWord[0].toUpperCase() + translatedWord.slice(1);
                    }
                    // underline if it's a dictionary reference word (not gibberish)
                    translatedWord = "__" + translatedWord + "__";
                    translatedText = translatedText.concat(translatedWord);
                    continue;
                }

                prevLetter = "";
                let wordBlocks = [];
                let wordBlock = "";
                let wordBlockNumbers = [];
                let translatedWordBlocks = [];
                const wordHash = hashCode(word.toLowerCase()) ^ hashCode(language);
                const wordNumber = digitalRoot(wordHash, 10);
                const wordNumberSharedLang1Hash = hashCode(word.toLowerCase()) ^ hashCode(sharedLang1);
                const wordNumberSharedLang2Hash = hashCode(word.toLowerCase()) ^ hashCode(sharedLang2);
                const wordNumberSharedLang1HashNumber = digitalRoot(wordNumberSharedLang1Hash, 10);
                const wordNumberSharedLang2HashNumber = digitalRoot(wordNumberSharedLang2Hash, 10);

                let useCons = cons;
                let usingSharedConsonants1 = false;
                let usingSharedConsonants2 = false;

                if (sharedCons1 && wordNumberSharedLang1HashNumber > 6) {
                    useCons = sharedCons1;
                    usingSharedConsonants1 = true;
                } else if (sharedCons2 && wordNumberSharedLang2HashNumber < 3) {
                    useCons = sharedCons2;
                    usingSharedConsonants2 = true;
                }

                const wordNumberPct = digitalRoot(wordHash, 101) - 1;
                let useCommonCons = commonPct && wordNumberPct < commonPct;

                let wordHashScramble = wordHash;
                if (!scrambling) {
                    wordHashScramble = 0;
                } else if (usingSharedConsonants1) {
                    wordHashScramble = wordNumberSharedLang1Hash;
                } else if (usingSharedConsonants2) {
                    wordHashScramble = wordNumberSharedLang2Hash;
                }

                for (let i = 0; i < word.length; i++) {
                    currentLetter = word.charAt(i);

                    if (i < word.length - 1) {
                        nextLetter = word.charAt(i + 1);
                    } else {
                        nextLetter = "b";
                    }

                    if (currentLetter.toLowerCase() === 'y' && charIsVowel(nextLetter)) {
                        currentLetter = 'j'; // y as consonant
                    }

                    if (charsAreSameType(currentLetter, prevLetter) || !prevLetter) {
                        wordBlock = wordBlock.concat(currentLetter.toLowerCase());
                    } else {
                        wordBlocks.push(wordBlock);
                        if (charIsVowel(wordBlock[0])) {
                            wordBlockNumbers.push(digitalRoot(hashCode(wordBlock + i.toString()) ^ wordHashScramble, vowels.start.length - 1))
                        } else {
                            wordBlockNumbers.push(digitalRoot(hashCode(wordBlock + i.toString()) ^ wordHashScramble, useCons.start.length - 1))
                        }
                        wordBlock = currentLetter;
                    }
                    if (i === word.length - 1 && wordBlock) {
                        if (wordBlock !== "e" || wordNumber < 6 || word.length < 4) {
                            // if last letter is "e", sometimes don't add it to wordBlocks
                            wordBlocks.push(wordBlock);
                            if (charIsVowel(wordBlock[0])) {
                                wordBlockNumbers.push(digitalRoot(hashCode(wordBlock + i.toString()) ^ wordHashScramble, vowels.start.length - 1))
                            } else {
                                wordBlockNumbers.push(digitalRoot(hashCode(wordBlock + i.toString()) ^ wordHashScramble, useCons.start.length - 1))
                            }
                        }
                    }
                    prevLetter = currentLetter;
                }

                if (wordBlockNumbers.length > 2 && wordNumber === 2) {
                    // remove a word block from the beginning.

                    wordBlockNumbers.shift();
                    wordBlocks.shift();
                    if (capitalizeFirst) {
                        wordBlocks[0] = wordBlocks[0][0].toUpperCase() + wordBlocks[0].slice(1);
                    }
                }
                if (wordBlockNumbers.length > 2 && wordNumber === 3) {
                    // remove a word block from the end.
                    wordBlockNumbers.pop();
                    wordBlocks.pop();
                }
                if (wordNumber === 5) {
                    // add a word block to the beginning.
                    let pseudoBlock = wordHash.toString();
                    //useCommonCons = false;
                    let consonant = "b";
                    let vowel = "a";
                    if (capitalizeFirst) {
                        consonant = "B";
                        vowel = "A";
                    }
                    if (charIsVowel(wordBlocks[0][0])) {
                        wordBlocks.unshift(consonant);
                        wordBlockNumbers.unshift(digitalRoot(hashCode(pseudoBlock), useCons.start.length - 1));
                    } else {
                        wordBlocks.unshift(vowel);
                        wordBlockNumbers.unshift(digitalRoot(hashCode(pseudoBlock), vowels.start.length - 1));
                    }
                }
                if (wordNumber === 9) {
                    // add a word block to the end.
                    let pseudoBlock = wordHash.toString();
                    //useCommonCons = false;
                    if (charIsVowel(wordBlocks[wordBlocks.length - 1][0])) {
                        wordBlocks.push("b");
                        wordBlockNumbers.push(digitalRoot(hashCode(pseudoBlock), useCons.start.length - 1));
                    } else {
                        wordBlocks.push("a");
                        wordBlockNumbers.push(digitalRoot(hashCode(pseudoBlock), vowels.start.length - 1));
                    }
                }

                let doubleVowelCount = 0;

                for (let j = 0; j < wordBlocks.length; j++) {
                    let wordPart = "middle";
                    if (j === 0) {
                        wordPart = "start";
                    } else if (j === wordBlocks.length - 1) {
                        wordPart = "end";
                    }
                    if (charIsVowel(wordBlocks[j][0])) {
                        let translatedWordBlock = vowels[wordPart][wordBlockNumbers[j]];
                        translatedWordBlocks.push(translatedWordBlock);
                        if (hasRepeats(translatedWordBlock)) {
                            doubleVowelCount++;
                        }
                    } else {
                        if (useCommonCons &&
                            allInputCharsAreInConsonantList(wordBlocks[j], useCons[wordPart]) &&
                            !(wordNumber === 5 && j === 0) &&
                            !(wordNumber === 9 && j === wordBlocks.length - 1)) {
                            translatedWordBlocks.push(wordBlocks[j]);
                        } else {
                            translatedWordBlocks.push(useCons[wordPart][wordBlockNumbers[j]]);
                        }
                    }
                }

                // here we filter out excessive double-vowels like "aa ii aa uu"
                if (doubleVowelCount > 1) {
                    let reduceVowelBlock = wordNumber > 5; // this should be about 50%
                    for (let j = 0; j < translatedWordBlocks.length; j++) {
                        if (charIsVowel(translatedWordBlocks[j][0]) && hasRepeats(translatedWordBlocks[j])) {
                            if (reduceVowelBlock) {
                                translatedWordBlocks[j] = removeDoubleLetters(translatedWordBlocks[j]);
                            }
                            reduceVowelBlock = !reduceVowelBlock;
                        }
                    }
                }

                translatedWord = translatedWordBlocks.join("");
                if (!vowels.middle.includes("uu")) {
                    translatedWord = translatedWord.replace(/quu/gi, "qu");
                }
                if (!vowels.middle.includes("yy")) {
                    translatedWord = translatedWord.replace(/yy/gi, "y");
                }

                translatedWord = removeTripleLetters(translatedWord);

                if (useCommonCons && translatedWord.length > 1 && translatedWord === word && !stopRecursion) {
                    translatedWord = translate(translatedWord, language, dictionary, vowels, cons, scrambling, sharedLang1, sharedCons1, sharedLang2, sharedCons2, 0, lengthPctCutoff, true);
                }

                while (translatedWordBlocks.length > 1 && translatedWord.length > lengthPctCutoff * word.length + 4 && !stopRecursion) {
                    // if the translated word is excessively long
                    translatedWordBlocks.pop();
                    translatedWord = translatedWordBlocks.join("");
                    translatedWord = translate(translatedWord, language, dictionary, vowels, cons, scrambling, sharedLang1, sharedCons1, sharedLang2, sharedCons2, commonPct, lengthPctCutoff, true);
                }

                if (Object.values(dictionary).includes(translatedWord.toLowerCase()) && !stopRecursion) {
                    // if this word already means something in the canon language, run it back through the translator
                    translatedWord = translate(translatedWord, language, dictionary, vowels, cons, scrambling, sharedLang1, sharedCons1, sharedLang2, sharedCons2, commonPct, lengthPctCutoff, true);
                }

                if (capitalizeFirst) {
                    translatedWord = translatedWord[0].toUpperCase() + translatedWord.slice(1);
                }

                translatedText = translatedText.concat(translatedWord);

            }
        }

        return translatedText;

    }

    var Widget = require("$:/core/modules/widgets/widget.js").widget;

    var GenerateGibberishWidget = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    /*
    Inherit from the base widget class
    */
    GenerateGibberishWidget.prototype = new Widget();

    /*
    Render this widget into the DOM
    */
    GenerateGibberishWidget.prototype.render = function (parent, nextSibling) {
        this.computeAttributes();
        this.execute();
    };

    /*
    Compute the internal state of the widget
    */
    GenerateGibberishWidget.prototype.execute = function () {
        this.actionTiddler = this.getVariable("currentTiddler");
        this.actionField = this.getAttribute("$field", "generatedname");
        this.language = this.getAttribute("$language", "Goblin");
        this.text = this.getAttribute("$text", "");
        const scrambling = this.getAttribute("$scrambling", "enabled") === "enabled";

        const dictionaryTiddlerName = `$:/${this.language}Dictionary`;
        const vowelTiddlerName = `$:/${this.language}GibberishVowels`;
        const consTiddlerName = `$:/${this.language}GibberishConsonants`;
        let dictionary, vowels, consonants, sharedLang1, sharedConsonants1, sharedLang2, sharedConsonants2, commonPct, lengthPctCutoff;
        try {
            dictionary = this.wiki.getTiddlerData(dictionaryTiddlerName, {});
            vowels = this.wiki.getTiddlerData(vowelTiddlerName, { start: ["a"], middle: ["a"], end: ["a"] });
            consonants = this.wiki.getTiddlerData(consTiddlerName, { start: ["b"], middle: ["b"], end: ["b"] });
        } catch (error) {
            return;
        }

        try {
            sharedLang1 = this.wiki.getTiddler(consTiddlerName).fields.relatedlanguage;
            const sharedCons1TiddlerName = `$:/${sharedLang1}GibberishConsonants`;
            sharedConsonants1 = this.wiki.getTiddlerData(sharedCons1TiddlerName, null);
            sharedLang1 = sharedLang1.replace(/[0-9]/g, '');
        } catch (error) {
            //
        }

        try {
            sharedLang2 = this.wiki.getTiddler(consTiddlerName).fields.relatedlanguageminor;
            const sharedCons2TiddlerName = `$:/${sharedLang2}GibberishConsonants`;
            sharedConsonants2 = this.wiki.getTiddlerData(sharedCons2TiddlerName, null);
            sharedLang2 = sharedLang2.replace(/[0-9]/g, '');
        } catch (error) {
            //
        }

        try {
            lengthPctCutoff = parseInt(this.wiki.getTiddler(consTiddlerName).fields.lengthpctcutoff);
        } catch (error) {
            lengthPctCutoff = 1.5;
        }

        try {
            commonPct = parseInt(this.wiki.getTiddler(consTiddlerName).fields.commonpct);
        } catch (error) {
            //
        }

        this.actionValue = translate(this.text, this.language, dictionary, vowels, consonants, scrambling, sharedLang1, sharedConsonants1, sharedLang2, sharedConsonants2, commonPct, lengthPctCutoff);
    };

    /*
    Refresh the widget by ensuring our attributes are up to date
    */
    GenerateGibberishWidget.prototype.refresh = function (changedTiddlers) {
        var changedAttributes = this.computeAttributes();
        if (changedAttributes["$language"] || changedAttributes["$field"] || changedAttributes["$text"]) {
            this.refreshSelf();
            return true;
        }
        return this.refreshChildren(changedTiddlers);
    };

    /*
    Invoke the action associated with this widget
    */
    GenerateGibberishWidget.prototype.invokeAction = function (triggeringWidget, event) {
        if (typeof this.actionValue === "string") {
            this.wiki.setText(this.actionTiddler, this.actionField, null, this.actionValue);
        }
        return true; // Action was invoked
    };

    exports["action-generate-gibberish"] = GenerateGibberishWidget;

})();