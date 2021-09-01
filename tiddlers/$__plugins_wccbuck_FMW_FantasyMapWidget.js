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

    var Radius;

    try {
        Radius = parseFloat(this.wiki.getTiddlerText("$:/WorldRadius"));
    } catch (e) {
        console.log("Encountered an error reading $:/WorldRadius. Using Earth radius.", e);
        Radius = 3960;
    }

    var LeafletDraw = require("$:/plugins/wccbuck/FMW/3rdParty/leaflet.draw.js")(Radius);


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

    var self = this;

    self.wiki.deleteTiddler("$:/DrawMeasurement");
    self.wiki.deleteTiddler("$:/DrawMeasurementLabel");
    self.wiki.deleteTiddler("$:/DrawPoints");

	var minZoom = this.getAttribute("minZoom", "1");
	var maxZoom = this.getAttribute("maxZoom", "20");
    var clipPadding = this.getAttribute("clipPadding", "0.5");

	this.map = L.map('fantasy-map-'+mapNumber, {
        //worldCopyJump: true,
		minZoom: parseInt(minZoom),
		maxZoom: parseInt(maxZoom),
        // preferCanvas: true
		renderer: L.svg({ padding: parseFloat(clipPadding) })
	});
	this.additionalStyle = this.getAttribute("additionalStyle");

	// empty tile layer. This isn't Earth
	var tiles = L.tileLayer('').addTo(this.map);

    // leaflet draw for distance/area calculations
    this.drawnItems = L.featureGroup().addTo(this.map);
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: self.drawnItems
        },
        draw: {
            polygon: {
                shapeOptions: {
                    color: "#6600FF"
                }
            },
            polyline: {
                shapeOptions: {
                    color: "#6600FF"
                }
            }
        }
    });
    this.map.addControl(drawControl);


    L.Control.TogglePolMap = L.Control.extend({
        options: {
            position: 'topright',
        },
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'leaflet-draw');
            var section = L.DomUtil.create('div', 'leaflet-draw-section', container);
            var toolbar = L.DomUtil.create('div', 'leaflet-bar leaflet-draw-toolbar-top', section);
            var button = L.DomUtil.create('a', 'fmw-polmap', toolbar);
            if (self.getAttribute("polmap", false) == "yes"){
                button.classList.add("fmw-active")
            }

            L.DomEvent
                .on(button, 'click', L.DomEvent.stopPropagation)
                .on(button, 'mousedown', L.DomEvent.stopPropagation)
                .on(button, 'dblclick', L.DomEvent.stopPropagation)
                .on(button, 'touchstart', L.DomEvent.stopPropagation)
                .on(button, 'click', L.DomEvent.preventDefault)
                .on(button, 'click', function(){
                    if (this.classList.contains("fmw-active")) {
                        this.classList.remove("fmw-active")
                        self.wiki.setText("$:/PolMap", "text", null, "no");
                    } else {
                        this.classList.add("fmw-active")
                        self.wiki.setText("$:/PolMap", "text", null, "yes");
                    }
                });

            button.title = "Toggle Political Map";
            button.href = "#";
            return container;
        }
    });
    this.togglePolMapControl = new L.Control.TogglePolMap();
    this.map.addControl(this.togglePolMapControl);

    //eberron-specific

    L.Control.SharnLevels = L.Control.extend({
        options: {
            position: 'topright',
        },
        onAdd: function(map){
            var container = L.DomUtil.create('div', 'leaflet-draw');
            var section = L.DomUtil.create('div', 'leaflet-draw-section', container);
            var toolbar = L.DomUtil.create('div', 'leaflet-bar leaflet-draw-toolbar-top', section);
            var levels = [
                {
                    title: "Skyway",
                    class: 'fmw-skyway',
                    filter: "[title[Skyway]]"
                },
                {
                    title: "Upper Wards",
                    class: 'fmw-upper',
                    filter: "[tag[upper ward]tagging[]tag[district]] [title[$:/UpperWardBridges]]"
                },
                {
                    title: "Middle Wards",
                    class: 'fmw-middle',
                    filter: "[tag[middle ward]tagging[]tag[district]] [title[$:/MiddleWardBridges]]"
                },
                {
                    title: "Lower Wards",
                    class: 'fmw-lower',
                    filter: "[tag[lower ward]tagging[]tag[district]] [title[$:/LowerWardBridges]]"
                },
                {
                    title: "Cogs + Cliffside",
                    class: 'fmw-cogs',
                    filter: "[tag[district]tag[Cogs]] [tag[district]tag[Cliffside]]"
                }
            ]

            for (var level of levels) {
                // todo: change this icon
                var button = L.DomUtil.create('a', level.class, toolbar);
                button.filter = level.filter;

                L.DomEvent
        			.on(button, 'click', L.DomEvent.stopPropagation)
        			.on(button, 'mousedown', L.DomEvent.stopPropagation)
        			.on(button, 'dblclick', L.DomEvent.stopPropagation)
        			.on(button, 'touchstart', L.DomEvent.stopPropagation)
        			.on(button, 'click', L.DomEvent.preventDefault)
        			.on(button, 'click', function(){
                        if (this.classList.contains("fmw-active")) {
                            for (let b of Array.from(toolbar.children)){
                                b.classList.remove("fmw-active");
                            }
                            showSharnLevel(self, null);
                        } else {
                            for (let b of Array.from(toolbar.children)){
                                b.classList.remove("fmw-active");
                            }
                            this.classList.add("fmw-active");
                            showSharnLevel(self, this.filter);
                        }
                    });

                button.title = level.title;
                button.href = "#";
            }

            return container;
        }
    });

    this.sharnLevels = new L.Control.SharnLevels();
    this.map.addControl(this.sharnLevels);

    var sharnShapesList = [
        [22.303,-24.64], [22.13,-24.73], [21.869,-24.769], [21.66,-24.648],
        [21.639,-24.478], [21.716,-24.296], [21.976,-24.241], [22.301,-24.269]
    ];

    var polygon = L.polygon(sharnShapesList);
    this.sharnBounds = polygon.getBounds();

    this.sharnQuarters = [];

	this.defaultColor = "#5077BE";
	this.defaultBoundsString = "-55.37,13.07,46.58,65.29,-29.88,26.12,21.09,52.24,-4.39,39.18";
	this.allMarkers = [];
    this.allTopMarkers = [];
	this.focus;
}

function showSharnLevel(self, filter){
    self.sharnDistrictLayer.clearLayers();

    if (filter) {
        for (var quarter of self.sharnQuarters){
            quarter.setStyle({"color":"#814A3C", "fillOpacity":0.125});
        }
        var districts = self.wiki.filterTiddlers(filter);
        for (var district of districts){
            mapTiddler(self, district, self.sharnDistrictLayer);
        }
    } else {
        for (var quarter of self.sharnQuarters){
            quarter.setStyle({"color":"#6B001B", "fillOpacity":0.25});
        }
    }

}

/*
Compute the internal state of the widget
*/
FantasyMapWidget.prototype.execute = function() {

	var self = this;

	L.icon.default = fmwIcon(self.defaultColor, "marker2");

	// self.shapeLayer = L.featureGroup({renderer: L.canvas({ padding: parseFloat(clipPadding) })}).addTo(self.map);
	// self.markerLayer = L.featureGroup({renderer: L.canvas()}).addTo(self.map);
    self.shapeLayer = L.featureGroup().addTo(self.map);
    self.sharnDistrictLayer = L.featureGroup().addTo(self.map);
    self.polMapLayer = L.featureGroup().addTo(self.map);
	self.markerLayer = L.featureGroup().addTo(self.map);
    self.topMarkerLayer = L.featureGroup().addTo(self.map);

	var filter = self.getAttribute("filter");
	var places = [];
	if (filter) {
		places = self.wiki.filterTiddlers(filter);
	}

	self.allMarkers = [];
    self.sharnQuarters = [];
	for (var place of places){
		mapTiddler(self, place);
	}

    // add draggable markers
    addTopMarkers(self);

    // show political map if enabled
    showPolMap(this);

	// fit bounds
	var boundsString = self.wiki.getTiddlerText("$:/MapBounds");
	if (!boundsString){
		boundsString = self.defaultBoundsString;
	}
	var boundSplit = boundsString.split(",");
	var bounds = L.latLngBounds(L.latLng(boundSplit[1], boundSplit[0]), L.latLng(boundSplit[3], boundSplit[2]));

	self.map.fitBounds(bounds);

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

		var boundsString = west+","+south+","+east+","+north+","+cLatString+","+cLngString;
		self.wiki.setText("$:/MapBounds", "text", undefined, boundsString);
	}

	var saveBoundsTimer;

	self.map.on('zoomend', function() {
        clearTimeout(saveBoundsTimer);
        saveBoundsTimer = setTimeout(saveBounds, 750);

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

        if (self.map.getZoom() > 6 && self.map.getBounds().intersects(self.sharnBounds)) {
            if(!self.sharnLevels._map){
                self.map.addControl(self.sharnLevels);
            }
            if (self.fmwvar){
                var button = self.document.getElementsByClassName(self.fmwvar)[0];
                if (button && !button.classList.contains("fmw-active")) {
                    button.click();
                }
                self.fmwvar = null;
            }
        } else {
            self.map.removeControl(self.sharnLevels);
            showSharnLevel(self,null);
            self.fmwvar = null;
        }

        var bounds = self.map.getBounds();
        var center = bounds.getCenter();
        var west = bounds.getWest();
        var east = bounds.getEast();
        if (center.lng < -130 && west < -360){
            self.map.panTo(L.latLng([center.lat, center.lng + 360]), {animate: false, noMoveStart: true})
        }
        if (center.lng > 230 && east > 360){
            self.map.panTo(L.latLng([center.lat, center.lng - 360]), {animate: false, noMoveStart: true})
        }
	});
	self.map.on('dragend', function() {
        clearTimeout(saveBoundsTimer);
        saveBoundsTimer = setTimeout(saveBounds, 750);

        for (var topMarker of self.allTopMarkers){
            topMarker.fire('dragend');
        }

        if (self.map.getZoom() > 6 && self.map.getBounds().intersects(self.sharnBounds)) {
            if(!self.sharnLevels._map){
                self.map.addControl(self.sharnLevels);
            }
            if (self.fmwvar){
                var button = self.document.getElementsByClassName(self.fmwvar)[0];
                button.click();
                self.fmwvar = null;
            }
        } else {
            self.map.removeControl(self.sharnLevels);
            showSharnLevel(self,null);
        }

        var bounds = self.map.getBounds();
        var center = bounds.getCenter();
        var west = bounds.getWest();
        var east = bounds.getEast();
        if (center.lng < -130 && west < -360){
            self.map.panTo(L.latLng([center.lat, center.lng + 360]), {animate: false, noMoveStart: true})
        }
        if (center.lng > 230 && east > 360){
            self.map.panTo(L.latLng([center.lat, center.lng - 360]), {animate: false, noMoveStart: true})
        }
	});

	self.map.fire('zoomend') //trigger filtering

    // fly to location if set
    if (self.getAttribute("fly", false)=="yes"){
        fly(self);
    }

    self.map.on(L.Draw.Event.DRAWSTART, function(event) {
        self.drawnItems.clearLayers();
        self.wiki.deleteTiddler("$:/DrawMeasurement");
        self.wiki.deleteTiddler("$:/DrawMeasurementLabel");
        self.wiki.deleteTiddler("$:/DrawPoints");
    });

    self.map.on(L.Draw.Event.CREATED, function(event) {
        var type = event.layerType,
            layer = event.layer;
            layer.on('click', function() {
                self.map.flyToBounds(layer.getBounds());
            });

        if (type === 'polyline'){
            var distance = 0;
            var previousPoint;
            var pointsString = "";
            layer.getLatLngs().forEach(function (latLng) {
              if (previousPoint) {
                  distance += latLng.distanceTo(previousPoint);
              }
              previousPoint = latLng;
              pointsString += Math.round(latLng.lat*1000)/1000+","+Math.round(latLng.lng*1000)/1000+" ";
            });
            distance = Math.round(distance*10)/10;
            self.wiki.setText("$:/DrawMeasurement", "text", undefined, String(distance)+" miles");
            self.wiki.setText("$:/DrawMeasurementLabel", "text", undefined, "Line Distance: ");
            self.wiki.setText("$:/DrawPoints", "text", undefined, pointsString.trim());
        }
        if (type === 'polygon'){
            var area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
            var pointsString = "";
            layer.getLatLngs()[0].forEach(function (latLng) {
              pointsString += Math.round(latLng.lat*1000)/1000+","+Math.round(latLng.lng*1000)/1000+" ";
            });
            self.wiki.setText("$:/DrawMeasurement", "text", undefined, L.GeometryUtil.readableArea(area, false, {}));
            self.wiki.setText("$:/DrawMeasurementLabel", "text", undefined, "Polygon Area: ");
            self.wiki.setText("$:/DrawPoints", "text", undefined, pointsString.trim());
        }
        self.drawnItems.addLayer(layer);
    });
};

function fly(self){
    try {
        var flyString = self.wiki.getTiddlerText("$:/FlyLocation");
        var fields = self.wiki.getTiddler("$:/FlyLocation").fields;
        self.fmwvar = fields.fmwvar;

        if (flyString) {
            flyString = flyString.trim();
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
    } catch(e) { console.log("Fly To error: ", e)}
}

function updateMarkerString(self, lat, lng, color){
    var coordString = String(Math.round(lat*1000)/1000)+","+String(Math.round(lng*1000)/1000);

    //actual lat/lng. Remove this if not altering projection
    var latPrime = Math.asin(lat/78.0)*180/Math.PI;
    var lngPrime = lng;
    if(lngPrime < -180) {lngPrime += 360;}
    if(lngPrime > 180) {lngPrime -= 360;}

    var NS1 = "N";
    var EW1 = "E";

    if (latPrime<0) {
        NS1 = "S";
        latPrime=-latPrime;
    }
    if (lngPrime<0) {
        EW1 = "W";
        lngPrime=-lngPrime;
    }

    var latlngString = String(Math.floor(latPrime))+"° "+String(Math.floor((latPrime-Math.floor(latPrime))*60))+"' "+NS1+", "+String(Math.floor(lngPrime))+"° "+String(Math.floor((lngPrime-Math.floor(lngPrime))*60))+"' "+EW1;

    self.wiki.setText("$:/Markers", "text", color, coordString+"|"+latlngString);
}

function addTopMarkers(self){
    self.allTopMarkers = [];

    var topMarkerData = self.wiki.getTiddlerData("$:/Markers",{});
    self.topMarkerLayer.clearLayers();

    Object.entries(topMarkerData).forEach(([key, value]) => {
       var coord = value.split("|")[0];
       var topMarker = addTopMarker(coord, key+" marker", key);
    });

	function addTopMarker(coordString, label, color){
		var strSplit = coordString.split(",");
        var topMarkerCopy = {};
		var topMarker = L.marker(L.latLng(strSplit[0], strSplit[1]), {
			title: label,
			zIndexOffset: 900,
			draggable:true,
			icon:fmwIcon(color, "marker3")
		}).addTo(self.topMarkerLayer).on('dragend',function() {
			var coord = topMarker.getLatLng();
			//map coords, not actual lat/lng
			var lat = coord.lat;
			var lng = coord.lng;

            updateMarkerString(self, lat, lng, color);

            try{
                topMarkerCopy.remove();
            } catch {}

    		var centerLng = 0;
            try{
                centerLng = self.map.getBounds().getCenter().lng;
            } catch {}
            var copyOffset = (lng < centerLng) ? 360 : -360;

            topMarkerCopy = L.marker(L.latLng(lat, lng + copyOffset), {
    			title: label,
    			zIndexOffset: 900,
    			draggable:true,
    			icon:fmwIcon(color, "marker3")
    		}).addTo(self.topMarkerLayer).on('dragend',function() {
    			var coord = topMarkerCopy.getLatLng();
    			//map coords, not actual lat/lng
    			var lat2 = coord.lat;
    			var lng2 = coord.lng;
                topMarker.setLatLng(L.latLng(lat2, lng2));
                setTimeout(function() {topMarker.fire('dragend')}, 10);
    		});
		});
        self.allTopMarkers.push(topMarker);
		topMarker.fire('dragend');
		return topMarker;
	}
    self.wiki.setText("$:/Markers", "refresh", null, "");
}

function showPolMap(self){
    if (self.getAttribute("polmap", false) == "yes"){
        var additionalStyleField = "nationstyle";
        var territories = self.wiki.filterTiddlers("[list[territory]tagging[]has[polygons]!has[polylines]]");
        for (var territory of territories){
            mapTiddler(self, territory, self.polMapLayer, additionalStyleField);
        }
        var lines = self.wiki.filterTiddlers("[list[territory]tagging[]has[polylines]]");
        for (var line of lines){
            mapTiddler(self, line, self.polMapLayer, additionalStyleField);
        }
    } else {
        try{
            self.polMapLayer.clearLayers();
        }catch {}
    }
}

function mapTiddler(self, place, layer=null, additionalStyleField=null){
	try {
		var fields = self.wiki.getTiddler(place).fields;

        var tags = fields.tags || "";
        if ((tags.includes("Sharn") && tags.includes("district"))||place.includes("WardBridges")){
            if (layer!=self.sharnDistrictLayer) return;
            // save this for SharnLevels
        }

		var color = self.defaultColor;
		var style = {};
		var additionalStyle = {};

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
				objTitle = fields.article.charAt(0).toUpperCase() + fields.article.slice(1) + objTitle;
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

		function clickAndHoverBehavior(element, isMarker=false){

			if (linkto) {
				var tt = element.bindTooltip(objTitle, {sticky: true});

				if (isTouchDevice()){
                    var ttElement = tt.getElement();
                    ttElement.style.pointerEvents = 'auto';
                    ttElement.addEventListener('click', function() {
                        var story = new $tw.Story();
						story.navigateTiddler(linkto);
                    });
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


        var offsets = [0, 360, -360];

		if (fields.points){
			var pointSplit = fields.points.split(" ");
			for (var pt of pointSplit) {
	            var location = pt.split(",");
				try {
					if (style.color) color = style.color;

                    for (var offset of offsets) {
                        var newLocation = [parseFloat(location[0]), parseFloat(location[1]) + offset];
                        var marker = L.marker(newLocation, {
    						icon: fmwIcon(color, "marker2")
    					});
    					marker.linkto = linkto;
    					clickAndHoverBehavior(marker, true);
                        self.markerLayer.addLayer(marker);
                        self.allMarkers.push(marker);
                    }
				} catch (e) {
					console.log("Failed to add point "+place, pt, e);
				}
			}
		} else {
			var feature = L.featureGroup();

			if (fields.polylines) {
				var lines = fields.polylines.split("|");
                for (var offset of offsets){
    				for (var ln of lines){
    					var lineSplit = ln.split(" ");
    					var polylinePoints = [];
    					try{
                            if (style.color) color = style.color;
    						for (var pt of lineSplit){
    							var location = pt.split(",");
                                location = [parseFloat(location[0]), parseFloat(location[1]) + offset];
    							polylinePoints.push(location);
    						}

    						var polyline = L.polyline(polylinePoints, {
    							color: color,
                                smoothFactor: 1.7
    						});

    						polyline.setStyle(style);
    						try {
    							if (additionalStyleField) additionalStyle = JSON.parse(fields[additionalStyleField]);
    							polyline.setStyle(additionalStyle);
    						} catch(e) {}
    						polyline.setStyle({"fill": false});
    						clickAndHoverBehavior(polyline);
    						polyline.addTo(feature);

    					} catch(e) {
    						console.log("Failed to add line "+place, ln, e);
    					}
    				}
                }
			}
			if (fields.polygons) {
				var polygons = fields.polygons.split("|");
                for (var offset of offsets){
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
                                        location = [parseFloat(location[0]), parseFloat(location[1]) + offset];
    		                            polygonPoints.push(location);
    		                    }
    		                    polygonsList.push(polygonPoints);
    			            }

    						var polygon = L.polygon(polygonsList, {
    							color: color,
                                smoothFactor: 1.7
    						});

    						polygon.setStyle(style);
    						try {
    							if (additionalStyleField) additionalStyle = JSON.parse(fields[additionalStyleField]);
    							polygon.setStyle(additionalStyle);
    						} catch(e) {}
    						clickAndHoverBehavior(polygon);
                            if (fields.tags.includes("Sharn") && fields.tags.includes("quarter")){
                                self.sharnQuarters.push(polygon);
                            }
    						polygon.addTo(feature);

    					} catch(e) {
    						console.log("Failed to add polygon "+place, pg, e);
    					}
    				}
                }
			}
			if(layer){
                feature.addTo(layer);
            }else{
                feature.addTo(self.shapeLayer);
            }
		}
	} catch (e) {
		console.log("Failed to map "+place, e);
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
    if (changedAttributes["fly"]){
        if (this.getAttribute("fly", false)=="yes"){
            fly(this);
        }
    }
    if (changedAttributes["markerRefresh"]){
        if (this.getAttribute("markerRefresh", false)=="yes"){
            addTopMarkers(this);
        }
    }
    if (changedAttributes["polmap"]){
        showPolMap(this);
    }
    if(changedAttributes["filter"] || changedAttributes["width"] || changedAttributes["height"]) {
        this.refreshSelf();
        return true;
    }
    return this.refreshChildren(changedTiddlers);
};

exports.fantasymap = FantasyMapWidget;

})();
