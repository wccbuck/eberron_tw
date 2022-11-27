/*\
title: $:/plugins/wccbuck/action-generate-name.js
type: application/javascript
module-type: widget

Action widget to generate a random name based on a geographic or linguistic origin.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function cleanUp(name, repeatedletters){
    let newName = [...name].reduce(function (accumulator, value, i, array) {
      if (value === array[i + 1] && !repeatedletters.includes(value)) return accumulator; // remove double letters
      if (i + 2 < array.length && value === array[i + 1] && value === array[i + 2]) return accumulator; // remove triple letters
      if (!accumulator.length) return value.toUpperCase();
      return accumulator + value;
    }, "");
    return newName;
}

function getRandom(array){
    return array[Math.floor(Math.random() * array.length)];
}

function isVowel(c){
    return ("aeiouyAEIOUY".indexOf(c) != -1);
}

function generateWildcardLists(data){
    var consonantList = [];
    var vowelList = [];
    for (const key in data){
        if (isVowel(key)){
            vowelList = vowelList.concat(data[key]);
        } else {
            consonantList = consonantList.concat(data[key]);
        }
    }
    data.consonant = consonantList;
    data.vowel = vowelList;
}

function reducedArray(array, name, minlength){
    var reducedArray = [...array];
    if (name.length < minlength){
        // remove "" from possibilities if name is too short
        reducedArray = reducedArray.filter(s => s !== "");
    }

    // Avoid names with 3x use of the same consonant in a row
    // Like "Talealelor" or what have you
    var lastLetter = name.charAt(name.length - 1)
    if (isVowel(lastLetter)){
        var repeatedConsonant = "@";
        var lastConsonant = "@";
        var foundVowel = false;
        for (let i = name.length-1; i >= 0; i--){
            if (isVowel(name[i])){
                foundVowel = true;
            } else {
                if (lastConsonant == name[i] && foundVowel){
                    repeatedConsonant = name[i];
                    reducedArray = reducedArray.filter(s => !s.startsWith(repeatedConsonant));
                    break;
                } else if (lastConsonant !== "@" && lastConsonant !== name[i]){
                    break;
                }
                foundVowel = false;
                lastConsonant = name[i];
            }
        }
    }

    return reducedArray;
}

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var GenerateNameWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GenerateNameWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GenerateNameWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

/*
Compute the internal state of the widget
*/
GenerateNameWidget.prototype.execute = function() {
	this.actionTiddler = this.getVariable("currentTiddler");
	this.actionField = this.getAttribute("$field","generatedname");
    this.origin = this.getAttribute("$origin", "Cyre");

    var originTiddlerName = `$:/${this.origin}NameChains`;
    var originFields;
    try {
        originFields = this.wiki.getTiddler(originTiddlerName).fields;
    } catch (error){
        originFields = {
            repeatedletters: "",
            minlength: 4,
            maxlength: 10
        }
    }

    var data = this.wiki.getTiddlerData(originTiddlerName,{});
    generateWildcardLists(data);

    var repeatedletters, minlength, maxlength;
    if ("repeatedletters" in originFields) {
        repeatedletters = originFields.repeatedletters;
    } else {
        repeatedletters = "";
    }
    if ("minlength" in originFields) {
        minlength = originFields.minlength;
    } else {
        minlength = 4;
    }
    if ("maxlength" in originFields) {
        maxlength = originFields.maxlength;
    } else {
        maxlength = 10;
    }

    var name = "";
    var letter = "";
    var letterArray = data[letter];
    var syllable = getRandom(letterArray);

    // this could be a while(true) but some inputs might cause infinite loops
    for (let i = 0; i<20; i++){
        if (syllable === "") break;
        else {
            if (name.length + syllable.length > maxlength) break;
            else {
                letter = syllable.charAt(syllable.length - 1);
                letterArray = [...data[letter]] || [];
                if (isVowel(letter)){
                    letterArray.push("*vowel");
                } else {
                    letterArray.push("*consonant");
                }
            }
        }

        name += syllable;
        letterArray = reducedArray(letterArray, name, minlength);
        syllable = getRandom(letterArray);
        if (syllable === "*vowel"){
            letterArray = data["vowel"];
            letterArray = reducedArray(letterArray, name, minlength);
            syllable = getRandom(letterArray);
        }
        if (syllable === "*consonant"){
            letterArray = data["consonant"];
            letterArray = reducedArray(letterArray, name, minlength);
            syllable = getRandom(letterArray);
        }
    }

    this.actionValue = cleanUp(name, repeatedletters);
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
GenerateNameWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$origin"] || changedAttributes["$field"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

/*
Invoke the action associated with this widget
*/
GenerateNameWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if(typeof this.actionValue === "string") {
	    this.wiki.setText(this.actionTiddler,this.actionField,null,this.actionValue);
    }
	return true; // Action was invoked
};

exports["action-generate-name"] = GenerateNameWidget;

})();
