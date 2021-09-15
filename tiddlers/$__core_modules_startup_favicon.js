/*\
title: $:/core/modules/startup/favicon.js
type: application/javascript
module-type: startup

Favicon handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "favicon";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;
		
// Favicon tiddler
var FAVICON_TITLE = "$:/favicon.ico";

exports.startup = function() {
	// Set up the favicon
	setFavicon();
	// Reset the favicon when the tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,FAVICON_TITLE)) {
			setFavicon();
		}
	});
};

function setFavicon() {
	var tiddler = $tw.wiki.getTiddler(FAVICON_TITLE);
	if(tiddler) {
		var faviconLink = document.getElementById("faviconLink");
		faviconLink.setAttribute("href",$tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri));

       faviconLink = document.getElementById("safari-pinned-tab");
		faviconLink.setAttribute("href",$tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri));
	}

    tiddler = $tw.wiki.getTiddler("$:/apple-touch-icon.png");
    if(tiddler) {
		var link = document.getElementById("ati-180");
		link.setAttribute("href",$tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri));
	}

    tiddler = $tw.wiki.getTiddler("$:/favicon-32x32.png");
    if(tiddler) {
		var link = document.getElementById("favicon32");
		link.setAttribute("href",$tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri));
	}

    tiddler = $tw.wiki.getTiddler("$:/favicon-16x16.png");
    if(tiddler) {
		var link = document.getElementById("favicon16");
		link.setAttribute("href",$tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri));
	}
}

})();
