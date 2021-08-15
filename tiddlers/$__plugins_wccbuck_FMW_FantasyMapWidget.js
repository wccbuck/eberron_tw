/*\
title: $:/plugins/wccbuck/FMW/FantasyMapWidget.js
type: application/javascript
module-type: widget

A widget for displaying a fantasy map using leaflet in Tiddlywiki

The projection is cylindrical with y = 78*sin(latitude).
Weird, yes, but it made the Eberron map look better than
any other "real" projection.

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
    L = require("$:/plugins/wccbuck/FMW/3rdParty/leaflet.js");

var FantasyMapWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};


/*
Inherit from the base widget class
*/
FantasyMapWidget.prototype = new Widget();

var mapNumber = 0;

/*
Render this widget into the DOM
*/
FantasyMapWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
    this.computeAttributes();

	var width = this.getAttribute("width", "100%"),
		height = this.getAttribute("height", "420px");

	var mapDiv = this.document.createElement("div");

	mapDiv.setAttribute("id", "fantasy-map-" + mapNumber);
	mapDiv.setAttribute("style", "width:"+width + ";height:"+height+";");
    parent.insertBefore(mapDiv,nextSibling);
	this.renderChildren(mapDiv,null);
	this.domNodes.push(mapDiv);

	this.initMap();

	this.execute();

	mapNumber += 1;
};

FantasyMapWidget.prototype.initMap = function() {

	var minZoom = this.getAttribute("minZoom", "1");
	var maxZoom = this.getAttribute("maxZoom", "20");
	var clipPadding = this.getAttribute("clipPadding", "0.5");
	this.map = L.map('fantasy-map-'+mapNumber, {
		minZoom: parseInt(minZoom),
		maxZoom: parseInt(maxZoom),
		renderer: L.svg({ padding: parseFloat(clipPadding) })
	});

	// empty tile layer. This isn't Earth
	var tiles = L.tileLayer('').addTo(this.map);

	//initialize lists and set up defaults
	this.defaultColor = "#5077BE";
	this.defaultBoundsString = "-55.37,13.07,46.58,65.29,-29.88,26.12,21.09,52.24,-4.39,39.18";
	this.allMarkers = [];
	this.focus;
}

/*
Compute the internal state of the widget
*/
FantasyMapWidget.prototype.execute = function() {

	var self = this;

	L.icon.default = fmwIcon(self.defaultColor, "marker2");

	self.shapeLayer = L.featureGroup().addTo(self.map);
	self.markerLayer = L.featureGroup().addTo(self.map);

	var filter = self.getAttribute("filter");
	var places = [];
	if (filter) {
		places = self.wiki.filterTiddlers(filter);
	}

	self.allMarkers = [];
	for (var place of places){
		mapTiddler(self, place);
	}

	// add origin/destination markers for distance calculations
	var originCoordString = self.wiki.getTiddlerText("$:/Origin");
	var destCoordString = self.wiki.getTiddlerText("$:/Destination");
	var posCoordString = self.wiki.getTiddlerText("$:/PartyPosition");

	function addTopMarker(coordString, label, tiddler, color, calcDist){
		var strSplit = coordString.split(",");
		var topMarker = L.marker(L.latLng(strSplit[0], strSplit[1]), {
			title: label,
			zIndexOffset: 900,
			draggable:true,
			icon:fmwIcon(color, "marker3",
			self.map)
		}).addTo(self.map).on('dragend',function() {
			var coord = topMarker.getLatLng();
			//map coords, not actual lat/lng
			var lat = coord.lat;
			var lng = coord.lng;
			coordString = String(Math.round(lat*1000)/1000)+","+String(Math.round(lng*1000)/1000);
			self.wiki.setText(tiddler, "text", undefined, coordString);

			//actual lat/lng. Remove this if not altering projection
			lat = Math.asin(lat/78.0)*180/Math.PI;

			var NS1 = "N";
			var EW1 = "E";

			if (lat<0) {
				NS1 = "S";
				lat=-lat;
			}
			if (lng<0) {
				EW1 = "W";
				lng=-lng;
			}

			var latlngString = String(Math.floor(lat))+"° "+String(Math.floor((lat-Math.floor(lat))*60))+"' "+NS1+", "+String(Math.floor(lng))+"° "+String(Math.floor((lng-Math.floor(lng))*60))+"' "+EW1;

			self.wiki.setText(tiddler, "latlng", undefined, latlngString);

			if (calcDist) {
				calculateDistance();
			}
		});
		topMarker.fire('dragend');
		return topMarker;
	}

	function calculateDistance(){

		// leaflet has distance measurement functions. However, this allows me
		// to use a different world radius or different map projections.

		var R, lat1, lat2, lng1, lng2;

		try {
			R = parseFloat(wk.getTiddlerText("$:/WorldRadius"));
		} catch (e) {
			R = 3960;
		}

		try {
			var originLatLng = self.origin.getLatLng();
			lat1 = originLatLng.lat;
			lat1 = Math.asin(lat1/78.0);
			lng1 = originLatLng.lng;

			var destLatLng = self.dest.getLatLng();
			lat2 = destLatLng.lat;
			lat2 = Math.asin(lat2/78.0);
			lng2 = destLatLng.lng;

			const dLat = (lat2-lat1);
			const dLng = (lng2-lng1) * Math.PI/180;

			const a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2) * Math.sin(dLng/2));
			const c = 2 * Math.asin(Math.sqrt(a));

			var d = R * c; // in miles
			d = Math.round(d * 10) / 10;
			self.wiki.setText("$:/Distance", "text", undefined, String(d));

		} catch (e) {
			self.wiki.setText("$:/Distance", "text", undefined, "0");
		}
	}

	if (originCoordString){
		self.origin = addTopMarker(originCoordString, "Origin", "$:/Origin", "green", true);
	}
	if (destCoordString){
		self.dest = addTopMarker(destCoordString, "Destination", "$:/Destination", "red", true);
	}
	if (posCoordString){
		self.pos = addTopMarker(posCoordString, "Party Position", "$:/PartyPosition", "darkblue", false);
	}

	calculateDistance();

	// fit bounds
	try {
		var boundsString = self.wiki.getTiddlerText("$:/MapBounds");
		if (!boundsString){
			boundsString = self.defaultBoundsString;
		}
		var boundSplit = boundsString.split(",");
		var bounds = L.latLngBounds(L.latLng(boundSplit[1], boundSplit[0]), L.latLng(boundSplit[3], boundSplit[2]));

		self.map.fitBounds(bounds);
	} catch(e) {}

	// save bounds

	function saveBounds() {
		var bounds = self.map.getBounds();
		var centerLat = bounds.getCenter().lat;
		var centerLng = bounds.getCenter().lng;
		var cLatString = String(Math.round(centerLat*100)/100);
		var cLngString = String(Math.round(centerLng*100)/100);

		var west = String(Math.round(bounds.getWest()*100)/100);
		var south = String(Math.round(bounds.getSouth()*100)/100);
		var east = String(Math.round(bounds.getEast()*100)/100);
		var north = String(Math.round(bounds.getNorth()*100)/100);

		var originLng = String(Math.round((bounds.getWest()+centerLng)*100/2)/100);
		var originLat = String(Math.round((bounds.getSouth()+centerLat)*100/2)/100);
		var destLng = String(Math.round((bounds.getEast()+centerLng)*100/2)/100);
		var destLat = String(Math.round((bounds.getNorth()+centerLat)*100/2)/100);

		var boundsString = west+","+south+","+east+","+north+","+originLng+","+originLat+","+destLng+","+destLat+","+cLngString+","+cLatString;
		self.wiki.setText("$:/MapBounds", "text", undefined, boundsString);
	}

	var saveBoundsTimer;

	self.map.on('zoomend', function() {
		// This stuff is eberron tiddlywiki specific. Needs to be generalized.
		// This hides markers based on "relevance" and zoom layer.
		var cutoffKhorvaire = self.wiki.getTiddlerData("$:/mapCutoffKhorvaire",[]);
		var cutoffNotKhorvaire = self.wiki.getTiddlerData("$:/mapCutoffNotKhorvaire",[]);
		var zoomIndex = self.map.getZoom() || 10;
		var cutoffFilter = "[has[points]!minrelevance["+cutoffNotKhorvaire[zoomIndex]+"]] [tag[Khorvaire]tagging[]has[points]!minrelevance["+cutoffKhorvaire[zoomIndex]+"]]";
		var cutoffTids = self.wiki.filterTiddlers(cutoffFilter);
		self.markerLayer.clearLayers();
		for (var marker of self.allMarkers){
			if (!cutoffTids.includes(marker.linkto)){
				self.markerLayer.addLayer(marker);
			}
		}

		clearTimeout(saveBoundsTimer);
		saveBoundsTimer = setTimeout(saveBounds, 750);
	});
	self.map.on('dragend', function() {
		clearTimeout(saveBoundsTimer);
		saveBoundsTimer = setTimeout(saveBounds, 750);
	});

	// if "FlyLocation" is set, fly to that new location

	try {
		var flyString = self.wiki.getTiddlerText("$:/FlyLocation").trim();

		if (flyString) {
			var flySplit = flyString.split(/[\#\|\s]+/);
			if (flySplit.length>1){
				var shapes = flyString.split(/[\#\|]+/);
				var shapesList = [];
				try {
					for (var shape of shapes){
						var coords = shape.split(" ");
						var shapeLocations = [];
						for (var nd in coords) {
							var location = coords[nd].split(",");
							shapeLocations.push(location);
						}
						shapesList.push(shapeLocations);
					}

					var polygon = L.polygon(shapesList);
					var bounds = polygon.getBounds();
					self.map.flyToBounds(bounds);
				} catch(e){}

			} else {
				var pt = flyString.split(",");
				self.map.flyTo(pt, 6);
			}
		}
		self.wiki.deleteTiddler("$:/FlyLocation");
	} catch(e) {}

	self.map.fire('zoomend') //trigger filtering
};

function mapTiddler(self, place){
	var fields = self.wiki.getTiddler(place).fields;

	var color = self.defaultColor;
	var style = {};

	try {
		if (fields.style) style = JSON.parse(fields.style);
	} catch(e) {
		console.log("Failed to parse style field for "+place, e);
	}

	// we don't always want the display title to be the linked tiddler
	// but if we've defined a "linkto" field, always point to that
	var linkto = fields.title;
	var objTitle = fields.title;
	if (fields.title){
		objTitle = fields.title.split(" (")[0];
		if (fields.article) {
			objTitle = fields.article + objTitle;
		}
		if (objTitle.startsWith("$:/")){
			objTitle = "";
			linkto = "";
		}
	}
	if (fields.linkto) {
		linkto = fields.linkto;
		objTitle = fields.linkto;
	}

	function isTouchDevice() {
	  return (('ontouchstart' in window)
		   || (navigator.MaxTouchPoints > 0)
		   || (navigator.msMaxTouchPoints > 0));
	}

	function clickAndHoverBehavior(element){

		if (linkto) {
			element.bindTooltip(objTitle, {sticky: true});
			if (isTouchDevice()){
				element.on('click', function() {
					if (objTitle == self.focus) {
						var story = new $tw.Story();
						story.navigateTiddler(linkto);
					} else {
						self.focus = objTitle;
					}
				});
			} else {
				element.on('click', function() {
					var story = new $tw.Story();
					story.navigateTiddler(linkto);
				});
			}
		}
	}


	if (fields.points){
		var pointSplit = fields.points.split(" ");
		for (var pt of pointSplit) {
            var location = pt.split(",");
			try {
				if (style.color) color = style.color;
				var marker = L.marker(location, {
					icon: fmwIcon(color, "marker2")
				});
				marker.linkto = linkto;
				clickAndHoverBehavior(marker);
				self.markerLayer.addLayer(marker);
				self.allMarkers.push(marker);
			} catch (e) {
				console.log("Failed to add point "+place, pt, e);
			}
		}
	} else {
		var feature = L.featureGroup();

		if (fields.polylines) {
			var lines = fields.polylines.split("|");
			for (var ln of lines){
				var lineSplit = ln.split(" ");
				var polylinePoints = [];
				try{
					if (style.color) color = style.color;
					for (var pt of lineSplit){
						var location = pt.split(",");
						polylinePoints.push(location);
					}

					var polyline = L.polyline(polylinePoints, {
						color: color
					});

					polyline.setStyle(style);
					polyline.setStyle({"fill": false});
					clickAndHoverBehavior(polyline);
					polyline.addTo(feature);

				} catch(e) {
					console.log("Failed to add line "+place, ln, e);
				}
			}
		}
		if (fields.polygons) {
			var polygons = fields.polygons.split("|");
			for (var pg of polygons){
				var polygonSegmentSplit = pg.split("#");
				var polygonsList = [];
				try {
					if (style.color) color = style.color;

					for (var shape of polygonSegmentSplit){
	                    var pgSplit = shape.split(" ");
	                    var polygonPoints = [];
	                    for (var pt of pgSplit) {
	                            var location = pt.split(",");
	                            polygonPoints.push(location);
	                    }
	                    polygonsList.push(polygonPoints);
		            }

					var polygon = L.polygon(polygonsList, {
						color: color
					});

					polygon.setStyle(style);
					clickAndHoverBehavior(polygon);
					polygon.addTo(feature);

				} catch(e) {
					console.log("Failed to add polygon "+place, pg, e);
				}
			}
		}
		feature.addTo(self.shapeLayer);
	}

}

function getIconUrl(color, markerTid){
	var iconUrlEsc = escape($tw.wiki.renderTiddler("text/html", markerTid).replace("$primary$", color).replace("</p>", "").replace("<p>", ""));
	return ('data:image/svg+xml;charset=UTF-8,' + iconUrlEsc);
}

function fmwIcon(color, marker){
	var markerTid = "$:/plugins/wccbuck/FMW/marker.svg";
	if (marker) {
		var markerTidTemp = "$:/plugins/wccbuck/FMW/"+marker+".svg";
		if($tw.wiki.getTiddler(markerTidTemp)) markerTid = markerTidTemp;
	}
	var shadowTid = markerTid.replace(".svg", "shadow.svg"),
		shadowUrl = 'data:image/svg+xml;charset=UTF-8,' + escape($tw.wiki.getTiddlerText(shadowTid));

	var markerDim = $tw.wiki.getTiddler(markerTid).fields.marker_dim.split(" ");
	var shadowDim = $tw.wiki.getTiddler(shadowTid).fields.marker_dim.split(" ");
	var icon = L.icon({
		iconUrl: getIconUrl(color, markerTid),
		iconRetinaUrl: getIconUrl(color, markerTid),
		iconSize: [markerDim[0], markerDim[1]],
		iconAnchor: [markerDim[2], markerDim[3]],
		popupAnchor: [0, -markerDim[3]],
		shadowUrl: shadowUrl,
		shadowRetinaUrl: shadowUrl,
		shadowSize: [shadowDim[0], shadowDim[1]],
		shadowAnchor: [shadowDim[2], shadowDim[3]]
	});
	return icon;
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
FantasyMapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
    if(changedAttributes["filter"] || changedAttributes["width"] || changedAttributes["height"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports.fantasymap = FantasyMapWidget;

})();
