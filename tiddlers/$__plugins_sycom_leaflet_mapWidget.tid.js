/*\
created: 20151028202401905
modified: 20170318234011605
title: $:/plugins/sycom/leaflet/mapWidget.tid
type: application/javascript
module-type: widget

A widget for displaying leaflet map in TiddlyWiki

\*/

(function() {
    /* ----------------------- */
    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";
    var Widget = require("$:/core/modules/widgets/widget.js").widget,
        L = require("$:/plugins/sycom/leaflet/lib/leaflet.js"),
        markerClusterGroup = require("$:/plugins/sycom/leaflet/lib/leaflet-markercluster.js");

    var mapWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    // global vars
    var Map = [],            // map collection
        map = 0,             // map order number
        tn = 0,              // tiddler number
        fCluster = [],       // the clusters
        Colour = [],         // the colors
        clusterRadius = [],  // cluster radii
        clusterType = [],    // clustering for whole map or for each tiddler
        lfltDefBounds = [
            [52.75, -2.55],
            [52.85, -2.65]
        ],                   // default bounds when nothing given
        bounds,              // global bounds for map ?todo one per map?
        iter = [],           // iteration indicator to avoid infinite loops
        setting = {};        // the map's settings

    var allMarkers = [];
    /* Inherit from the base widget class */
    mapWidget.prototype = new Widget();

    /* Render this widget into the DOM */
    mapWidget.prototype.render = function(parent, nextSibling) {
        bounds = null;
        // Compute our attributes
        this.computeAttributes();
        // Get the base settings for rendering : width / height (default : 100% / 500px)
        // !todo : make a settings tidller in order to let user set it for the whole wiki (may be inspired from roadtree)
        // !todo what happens if windows is resized?
        var width = this.getAttribute("width", "100%"),
            height = this.getAttribute("height", "420px");
        // creating the div container
        var div = this.document.createElement("div");
        div.setAttribute("id", "lfltMap-" + map);
        div.setAttribute("style", "width:" + width + ";height:" + height);
        // Save the parent dom node
        this.parentDomNode = parent;
        // Compute our attributes
        // this.computeAttributes();
        // create the container
        parent.insertBefore(div, nextSibling);
        this.domNodes.push(div);
        // Create the map
        this.createMap();
        // Execute our logic
        this.execute();
        // increment map number indicator
        map += 1;
    };

    /* Create the map for the widget */
    mapWidget.prototype.createMap = function(parent, nextSibling) {
        // create the leaflet and push it to #lfltMap
        Map[map] = L.map('lfltMap-' + map);
        // Install base tile layer (if none provided, default is "none")
        // get tilelayers from JSON
        var fonds = JSON.parse(this.wiki.getTiddlerText("$:/plugins/sycom/leaflet/lib/tileLayers.json"));
        // create tile layers list object from json list
        var Tiles = []; // leaflet tile layers
        var tiles = {}; // tile identifier for control
        // look for tile parameter
        setting.tile = this.getAttribute("tile", "none");
        setting.marker = this.getAttribute("marker", null);
        // create tile layer list
        for (var i in fonds) {
            if (i == setting.tile || fonds[i].id == setting.tile) {
                setting.tile = fonds[i].id;
            }
            var couche = new L.TileLayer(fonds[i].url, {
                attribution: fonds[i].attrib,
                minZoom: fonds[i].zMin,
                maxZoom: fonds[i].zMax,
                unloadInvisibleTiles: true
            });
            Tiles[fonds[i].id] = couche;
            tiles[fonds[i].nom] = couche;
        }
        // if user entered a wrong tile id
        if (Tiles[setting.tile] === undefined) {
            setting.tile = "none";
            $tw.utils.error("Seems you entered a wrong tile id, displayed none instead. Please refer to plugin documentation to avoid this - error : " + error);
        }
        Tiles[setting.tile].addTo(Map[map]);
        // install tile layer control if needed
        setting.tileControl = this.getAttribute("tileControl");
        if (setting.tileControl) {
            var tControl = L.control.layers(tiles);
            tControl.addTo(Map[map]);
        }
        /* !todo to come next (will have to implement leaflet.draw extension)
    // look for draw parameter
    setting.drawControl = this.getAttribute("drawControl");
    if (setting.drawControl) {
       // Initialize the FeatureGroup to store editable layers
       var drawnItems = new L.FeatureGroup();
       Map[map].addLayer(drawnItems);
       // Initialize the draw control and pass it the FeatureGroup of editable layers
       var drawControl = new L.Control.Draw({
          edit: {
             featureGroup: drawnItems
             }
          }
       );
    Map[map].addControl(drawControl);
    }
*/
    };

    /* Compute the internal state of the widget */
    mapWidget.prototype.execute = function() {

        // getting wiki primary color
        // check if you defined a tiddler name for palette but no tiddler with that
        if(this.wiki.getTiddlerData(this.wiki.getTiddlerText("$:/palette"))) Colour.wiki = this.wiki.getTiddlerData(this.wiki.getTiddlerText("$:/palette")).primary;
        // switch back to basic blue
        else Colour.wiki = "#5778d8";

        // switch back to basic tiddlywiki blue if primary is defined from another color
        /* notes to upgrade this process
  if primaire is <<colour xxxx>> set to default gray
  if primaire.match("<<") primaire="#555"; */
        if (Colour.wiki.match(/</g)) Colour.wiki = "#5778d8";

        // getting style parameters
        var style = this.getAttribute("style", undefined);
        var st;
        // case style defined
        if(style !== undefined) {
            st = JSON.parse(style);
            // color parameter will overwrite style color and style fillColor parameter
            if(st.fillColor) Colour[map] = st.fillColor;
            else if(st.color) Colour[map] = st.color;
            else Colour[map] = this.getAttribute("color", undefined);
        }
        // case style undefined
        else {
            st = null;
            // checking if user defined a color if no color go undefined
            Colour[map] = this.getAttribute("color", undefined);
        }
        // create default icon
        // ?todo: only if there are points to display?
        L.icon.default = lfltIcon(setColor(null, map), setting.marker, map);

        // create whole map cluster
        // getting cluster size parameter, if exists
        clusterRadius[map] = this.getAttribute("cluster", 80);
        clusterType[map] = this.getAttribute("clusterType", "map");
        if (clusterRadius[map] === 0 || clusterType[map] == "tiddler") {
            // if clusterRadius null or clustering by tiddler, no whole clustering
            fCluster[map] = L.featureGroup();
        } else {
            // creating a cluster group for whole map
            fCluster[map] = L.markerClusterGroup({
                name: "Cluster" + map,
                polygonOptions: {"weight":"0.5"},
                maxClusterRadius: clusterRadius[map],
                /* for the record. may be a function
      function() {return (clusterRadius - 50) / 9 * Map[map].getZoom() + 50 - (clusterRadius - 50) / 9 },*/
                iconCreateFunction: createCluster
            });
        }
        // Get the declared places from the attributes
        var places = this.getAttribute("places", undefined);
        var feature = L.featureGroup();
        // Render the map
        if (places) mapPlaces(this,
            JSON.parse(places),
            Map[map],
            fCluster[map],
            null,
            Colour[map],
            this.getAttribute("marker"),
            st
            );

        // add origin/destination markers for distance calculations
        var wk = this.wiki;
        var originLatLngString = wk.getTiddlerText("$:/Origin");
        var destLatLngString = wk.getTiddlerText("$:/Destination");
        var posLatLngString = wk.getTiddlerText("$:/PartyPosition");
        Map[map].createPane("topMarker");
        Map[map].getPane("topMarker").style.zIndex = 999;

        function calculateDistance(wk) {

            var R, lat1, lat2, lon1, lon2;
            try {
                R = parseFloat(wk.getTiddlerText("$:/EberronRadius"));
            } catch {
                R = 3960;
            }

            try {
                var originLatLngString = wk.getTiddlerText("$:/Origin");
                var destLatLngString = wk.getTiddlerText("$:/Destination");

                var originSplit = originLatLngString.split(",");
                lat1 = parseFloat(originSplit[0]);
                lat1 = Math.asin(lat1/78.0);
                lon1 = parseFloat(originSplit[1]);

                var destSplit = destLatLngString.split(",");
                lat2 = parseFloat(destSplit[0]);
                lat2 = Math.asin(lat2/78.0);
                lon2 = parseFloat(destSplit[1]);

                const dLat = (lat2-lat1);
                const dLon = (lon2-lon1) * Math.PI/180;

                const a = (Math.sin(dLat/2) * Math.sin(dLat/2)) + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2));
                const c = 2 * Math.asin(Math.sqrt(a));

                var d = R * c; // in miles
                d = Math.round(d * 10) / 10;
                wk.setText("$:/Distance", "text", undefined, String(d));

                var NS1 = "N";
                var EW1 = "E";
                var NS2 = "N";
                var EW2 = "E";

                lat1 = lat1*180/Math.PI;
                lat2 = lat2*180/Math.PI;

                if (lat1<0) {
                    NS1 = "S";
                    lat1=-lat1;
                }
                if (lat2<0) {
                    NS2 = "S";
                    lat2=-lat2;
                }
                if (lon1<0) {
                    EW1 = "W";
                    lon1=-lon1;
                }
                if (lon2<0) {
                    EW2 = "W";
                    lon2=-lon2;
                }

                var latlngstr1 = String(Math.floor(lat1))+"° "+String(Math.floor((lat1-Math.floor(lat1))*60))+"' "+NS1+", "+String(Math.floor(lon1))+"° "+String(Math.floor((lon1-Math.floor(lon1))*60))+"' "+EW1;
                var latlngstr2 = String(Math.floor(lat2))+"° "+String(Math.floor((lat2-Math.floor(lat2))*60))+"' "+NS2+", "+String(Math.floor(lon2))+"° "+String(Math.floor((lon2-Math.floor(lon2))*60))+"' "+EW2;

                wk.setText("$:/Origin", "latlng", undefined, latlngstr1);
                wk.setText("$:/Destination", "latlng", undefined, latlngstr2);

            } catch {
                wk.setText("$:/Distance", "text", undefined, "0");
            }

        }


        if (originLatLngString) {
            var originSplit = originLatLngString.split(",");
            var originMarker = L.marker(L.latLng(originSplit[0], originSplit[1]), {title: "Origin", pane: "topMarker", draggable:true, icon:lfltIcon("green", "pin", Map[map])}).addTo(Map[map]).on('dragend',function() {
                var coord = String(originMarker.getLatLng()).split(',');
                var lat = coord[0].split('(');
                var lng = coord[1].split(')');
                var coordString = String(Math.round(parseFloat(lat[1])*1000)/1000)+","+String(Math.round(parseFloat(lng[0])*1000)/1000);
                wk.setText("$:/Origin", "text", undefined, coordString);
                calculateDistance(wk);
            });
        }
        if (destLatLngString) {
            var destSplit = destLatLngString.split(",");
            var destMarker = L.marker(L.latLng(destSplit[0], destSplit[1]), {title: "Destination", pane: "topMarker", draggable:true, icon:lfltIcon("red", "pin", Map[map])}).addTo(Map[map]).on('dragend',function() {
                var coord = String(destMarker.getLatLng()).split(',');
                var lat = coord[0].split('(');
                var lng = coord[1].split(')');
                var coordString = String(Math.round(parseFloat(lat[1])*1000)/1000)+","+String(Math.round(parseFloat(lng[0])*1000)/1000);
                wk.setText("$:/Destination", "text", undefined, coordString);
                calculateDistance(wk);
            });
        }
        if (posLatLngString) {
            var posSplit = posLatLngString.split(",");
            var posMarker = L.marker(L.latLng(posSplit[0], posSplit[1]), {title: "Party Position", pane: "topMarker", draggable:true, icon:lfltIcon("darkblue", "pin", Map[map])}).addTo(Map[map]).on('dragend',function() {
                var coord = String(posMarker.getLatLng()).split(',');
                var lat = coord[0].split('(');
                var lng = coord[1].split(')');
                var coordString = String(Math.round(parseFloat(lat[1])*1000)/1000)+","+String(Math.round(parseFloat(lng[0])*1000)/1000);
                wk.setText("$:/PartyPosition", "text", undefined, coordString);

                var posSplit = coordString.split(",");
                var lat1 = parseFloat(posSplit[0]);
                lat1 = Math.asin(lat1/78.0)*180/Math.PI;
                var lon1 = parseFloat(posSplit[1]);

                var NS1 = "N";
                var EW1 = "E";

                if (lat1<0) {
                    NS1 = "S";
                    lat1=-lat1;
                }
                if (lon1<0) {
                    EW1 = "W";
                    lon1=-lon1;
                }

                var latlngstr = String(Math.floor(lat1))+"° "+String(Math.floor((lat1-Math.floor(lat1))*60))+"' "+NS1+", "+String(Math.floor(lon1))+"° "+String(Math.floor((lon1-Math.floor(lon1))*60))+"' "+EW1;

                wk.setText("$:/PartyPosition", "latlng", undefined, latlngstr);
            });
        }
        calculateDistance(wk);

        // set map to objects bounds

        try {
            var boundsString = this.wiki.getTiddlerText("$:/MapBounds");
            if (boundsString) {
                var boundSplit = boundsString.split(",");
                bounds = L.latLngBounds(L.latLng(boundSplit[1], boundSplit[0]), L.latLng(boundSplit[3], boundSplit[2]));
            }

            if (!bounds) {
                bounds = lfltDefBounds;
            }
            Map[map].fitBounds(bounds);
        } catch(e) {}
        // if lat long zoom settings, overwrite bounds
        setting.lat = this.getAttribute("lat");
        setting.lg = this.getAttribute("long");
        setting.zoom = this.getAttribute("zoom");
        // overwrite lat and long center
        if (setting.lat && setting.lg) {
            Map[map].setView([setting.lat, setting.lg]);
        }
        // overwrite zoom
        if (setting.zoom) {
            Map[map].setZoom(setting.zoom);
        }

        // if relevant, fly to new location

        try {
            var flyString = this.wiki.getTiddlerText("$:/FlyLocation").trim();

            if (flyString) {
                var flySplit = flyString.split(/[\#\|\s]+/);
                if (flySplit.length>1){
                    var Shapes = flyString.split(/[\#\|]+/);
                    var ShapesList = [];
                    try {
                        for (var shape in Shapes){
                            var Coords = Shapes[shape].split(" ");
                            var Shape = [];
                            for (var nd in Coords) {
                                var location = Coords[nd].split(",");
                                Shape.push(location);
                            }
                            ShapesList.push(Shape);
                        }

                        var polygon = L.polygon(ShapesList);
                        var bounds = polygon.getBounds();
                        Map[map].fitBounds(bounds);
                    }catch(e){}

                } else {
                    var pt = flyString.split(",");
                    Map[map].flyTo(pt, 6, {animate: false});
                }
            }

            this.wiki.deleteTiddler("$:/FlyLocation");
        } catch(e) {}

    };

    // mapping a places json object (parent object, places json object, destination feature, destination cluster, popup for base objects, ands style parameters : color, marker, json style)
    function mapPlaces(obj, plcs, feat, clust, pop, col, mark, style) {
        // create feature for this mapping turn
        var feature = L.featureGroup();
        // case 1 : data in a tiddler
        if (plcs.tiddler) {
            // if no tiddler is given (single space) map current Tiddler
            // !todo would be much better if so when no attribute at all...
            if (plcs.tiddler == " ") {
                mapTiddler(obj, obj.getVariable("currentTiddler"), feature, clust, pop, col, mark, style);
            }
            // else, map the given tiddler
            else {
                // get data fields in the tiddler, let's seek for geo data
                mapTiddler(obj, plcs.tiddler, feature, clust, pop, col, mark, style);
            }
        }
        // case 2 : data in multiple tiddlers
        if (plcs.tiddlers) {
            mapTiddlers(obj, plcs.tiddlers, feature, clust, pop, col, mark, style);
        }
        // case 3 : data in tiddlers following a filter
        if (plcs.filter) {
            mapFilter(obj, plcs.filter, feature, clust, pop, col, mark, style);
        }
        // case 4 : data are directly listed in places (point(s) - polygon - polyline - geojson)
        // for each we will
        // - use dedicated function to populate mapping turn layer
        // - add layer to map

        var linkto = plcs.title;
        var objTitle = plcs.title;
        if (plcs.title){
            objTitle = plcs.title.split(" (")[0];
            if (plcs.article) {
                objTitle = plcs.article + objTitle;
            }
            if (objTitle.startsWith("$:/")){
                objTitle = "";
                linkto = "";
            }
        }
        if (plcs.linkto) {
            linkto = plcs.linkto;
            objTitle = plcs.linkto;
        }
        if (plcs.point) {
            // add the point to the cluster layer
            mapPoint(plcs.point, clust, pop, col, style, mark, objTitle, linkto);
            // add the cluster layer to map
            feature.addLayer(clust);
            // set bounds
        }
        if (plcs.points) {
            // ?todo : create a cluster for those points if clusterType == "tiddler"
            mapPoints(plcs.points, clust, pop, col, style, mark, objTitle, linkto);
            feature.addLayer(clust);
        }
        if (plcs.polygon) {
            var polygFeat = L.featureGroup();
            mapPolyg(plcs.polygon, polygFeat, pop, col, style, objTitle, linkto);
            polygFeat.addTo(feature);
        }
        if (plcs.polygons) {
            var polygsFeat = L.featureGroup();
            mapPolygs(plcs.polygons, polygsFeat, pop, col, style, objTitle, linkto);
            polygsFeat.addTo(feature);
        }
        if (plcs.polyline) {
            var polylFeat = L.featureGroup();
            mapPolyl(plcs.polyline, polylFeat, pop, col, style, objTitle, linkto);
            polylFeat.addTo(feature);
        }
        if (plcs.polylines) {
            var polylsFeat = L.featureGroup();
            mapPolyls(plcs.polylines, polylsFeat, pop, col, style, objTitle, linkto);
            polylsFeat.addTo(feature);
        }
        if (plcs.geojson) {
            // !todo : create a cluster for those points if clusterType == "tiddler"
            var geojsonFeat = L.featureGroup();
            mapGeoJson(plcs.geojson, geojsonFeat, clust, col, mark, style);
            geojsonFeat.addTo(feat);
        }
        // add feature to map
        feature.addTo(feat);

        extBounds(feature);

        function saveBounds() {
            var bounds = feat.getBounds();
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
            obj.wiki.setText("$:/MapBounds", "text", undefined, boundsString);
        }

        var saveBoundsTimer;

        feat.on('zoomend', function() {
            var cutoffKhorvaire = obj.wiki.getTiddlerData("$:/mapCutoffKhorvaire",[]);
            var cutoffNotKhorvaire = obj.wiki.getTiddlerData("$:/mapCutoffNotKhorvaire",[]);
            var zoomIndex = feat.getZoom() || 10;
            var cutoffFilter = "[has[points]!minrelevance["+cutoffNotKhorvaire[zoomIndex]+"]] [tag[Khorvaire]tagging[]has[points]!minrelevance["+cutoffKhorvaire[zoomIndex]+"]]";
            var cutoffTids = obj.wiki.filterTiddlers(cutoffFilter);
            clust.clearLayers();
            for (var marker of allMarkers){
                if (!cutoffTids.includes(marker.linkto)){
                    clust.addLayer(marker);
                }
            }

            clearTimeout(saveBoundsTimer);
            saveBoundsTimer = setTimeout(saveBounds, 750);
        });
        feat.on('dragend', function() {
            clearTimeout(saveBoundsTimer);
            saveBoundsTimer = setTimeout(saveBounds, 750);
        });
    }

    function isTouchDevice() {
      return (('ontouchstart' in window)
           || (navigator.MaxTouchPoints > 0)
           || (navigator.msMaxTouchPoints > 0));
    }

    var focus;
    // add a marker for a point
    function mapPoint(coord, clust, pop, col, st, mark, objTitle="", linkto="") {
        try {
            var location = coord.split(",");
        } catch (err) {displayError("point coord error", err);}
        try {
            if (st.color) col = st.color;
            var marker = L.marker(location, {
                icon: lfltIcon(col, mark, map)
            });
            marker.linkto = linkto;
            if (linkto) {
                marker.bindTooltip(objTitle, {sticky: true});
                if (isTouchDevice()){
                    marker.on('click', function() {
                        if (objTitle == focus) {
                            var story = new $tw.Story();
                            story.navigateTiddler(linkto);
                        } else {
                            focus = objTitle;
                        }
                    });
                } else {
                    marker.on('click', function() {
                        var story = new $tw.Story();
                        story.navigateTiddler(linkto);
                    });
                }
            }
            if (pop) marker.bindPopup(pop);
            if (clust.count) clust.count +=1;
            else clust.count = 1;
            clust.addLayer(marker);
            allMarkers.push(marker);
        } catch (err) {displayError("point marker error", err);}
    }
    // add a marker serie for a points list
    function mapPoints(list, clust, pop, col, st, mark, objTitle="", linkto="") {
        var Points = list.split(" ");
        for (var pt in Points) {
            mapPoint(Points[pt], clust, pop, col, st, mark, objTitle, linkto);
        }
    }

    // add a polygon
    function mapPolyg(list, feat, pop, col, st, objTitle="", linkto="") {
        var Shapes = list.split("#");
        var ShapesList = [];
        try {
            for (var shape in Shapes){
                    var Coords = Shapes[shape].split(" ");
                    var Shape = [];
                    for (var nd in Coords) {
                            var location = Coords[nd].split(",");
                            Shape.push(location);
                    }
                    ShapesList.push(Shape);
            }

            var polygon = L.polygon(ShapesList, {
                color: setColor(col, map)
            });
            if (linkto) {
                polygon.bindTooltip(objTitle, {sticky: true});

                if (isTouchDevice()){
                    polygon.on('click', function() {
                        if (objTitle == focus) {
                            var story = new $tw.Story();
                            story.navigateTiddler(linkto);
                        } else {
                            focus = objTitle;
                        }
                    });
                } else {
                    polygon.on('click', function() {
                        var story = new $tw.Story();
                        story.navigateTiddler(linkto);
                    });
                }
            }
            if (st) polygon.setStyle(checkStyle(st, col));
            if (pop) polygon.bindPopup(pop);
            polygon.addTo(feat);

        } catch (err) {
            displayError("polygon", err);
        }
    }
    // add a polygons collection
    function mapPolygs(collec, feat, pop, col, st, objTitle="", linkto="") {
        var Polys = collec.split("|");
        for (var pg in Polys) {
            mapPolyg(Polys[pg], feat, pop, col, st, objTitle, linkto);
        }
    }
    // add a polyline
    function mapPolyl(list, feat, pop, col, st, objTitle="", linkto="") {
        var Coords = list.split(" ");
        var Line = [];
        try {
            for (var nd in Coords) {
                var location = Coords[nd].split(",");
                Line.push(location);
            }
        } catch (err) {
            displayError("polyline", err);
        }
        try {
            var polyline = L.polyline(Line, {
                color: setColor(col,map)
            });
            if (linkto) {
                polyline.bindTooltip(objTitle, {sticky: true});
                if (isTouchDevice()){
                    polyline.on('click', function() {
                        if (objTitle == focus) {
                            var story = new $tw.Story();
                            story.navigateTiddler(linkto);
                        } else {
                            focus = objTitle;
                        }
                    });
                } else {
                    polyline.on('click', function() {
                        var story = new $tw.Story();
                        story.navigateTiddler(linkto);
                    });
                }
            }
            if (st) polyline.setStyle(checkStyle(st, col));
            if (pop) polyline.bindPopup(pop);
            // add polyline class in order to make fill transparent
            polyline.setStyle({
                "className": "polyline"
            }).addTo(feat);
        } catch (err) {
            displayError("polyline", err);
        }
    }
    // add a polylines collection
    function mapPolyls(collec, feat, pop, col, st, objTitle="", linkto="") {
        var Lines = collec.split("|");
        for (var ln in Lines) {
            mapPolyl(Lines[ln], feat, pop, col, st, objTitle, linkto);
        }
    }

    // add a geojson set
    function mapGeoJson(geojson, feat, clust, col, mark, st) {
        try {
            var data = JSON.parse(geojson);
            var geoJson = L.geoJSON(data, {
                // adding style
                style: function (feature) {
                    // get feature style only if style is not injected
                    // ?todo : only overwrite injected values?
                    if (st === undefined || st === null) {
                        st = {};
                        if(feature.properties.style !== undefined) st = feature.properties.style;
                    }
                    // get feature properties style if exists
                    if(feature.properties.color !== undefined) {
                        st.color = feature.properties.color;
                        st.fillColor = st.color;
                    }
                    // color parameter overwrite style color if exists
                    if (col !== undefined && col !== null) {
                        st.color = col;
                        st.fillColor = col;
                    }
                    // if no color is defined at the end, fallback
                    if (st.color === undefined) {
                        col = setColor(col, map);
                        st.color = col;
                        st.fillColor = col;
                    }
                    return st;
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(jsonPop(feature));
                },
                // adding points
                pointToLayer: function(geoJsonPoint, latlng) {
                    // working to get color (from properties)
                    var cl;
                    if(geoJsonPoint.properties.color !== undefined) cl = geoJsonPoint.properties.color;
                    if(geoJsonPoint.properties.fillColor !== undefined) cl = geoJsonPoint.properties.fillColor;
                    if(col !== undefined && col !== null) cl = col;
                    // binding default icon
                    var jsonPoint = L.marker(latlng, {
                        icon: lfltIcon(cl, mark, map)
                    });
                    jsonPoint.bindPopup(jsonPop(geoJsonPoint));
                    if (clust.count) clust.count +=1;
                    else clust.count = 1;
                    clust.addLayer(jsonPoint);
                }
            });

            // ?todo : should we add clust to feat or to geoJson? should we add clust even if it's already here?
            feat.addLayer(clust);
            feat.addLayer(geoJson);
        } catch (error) {displayError("there was an error when displaying geoJson. error : ", error);}
    }

    // map a tiddler
    function mapTiddler(obj, tid, feat, clust, pop, col, mark, style) {
        if(iter.map.tid === undefined) iter.map.tid = 1;
        else iter.map.tid +=1;
        if(iter.map.tid < 4242) {
            // get data fields in the tiddler, let's seek for geo data
            var flds = obj.wiki.getTiddler(tid).fields,
                feature = L.featureGroup();               // create the tiddler feature
                //popup = "";                               // create the popup text
            // setting marker, color, style
            // if no marker injected, trying to get from tiddler
            if(mark === null || mark === undefined) {
                if(flds.marker) mark = flds.marker;
            }
            // working style and color together
            var cl, st = {};
            // style
            if(flds.style) st = JSON.parse(flds.style);
            // overwrite with injected values
            if (style !== undefined && style !== null) {
                st = style;
                /* ?todo : should we overwrite only injected?
                for (var v in st) {
                   if(style.v !== undefined) st.v = style.v;
                }
                for (var v in style) {
                }*/
            }
            // color
            if (style !== undefined && style !== null) {
                if (st.fillColor !== undefined) cl = st.fillColor;
            }
            // overwrite with injected color also in style
            if (col !== undefined && col !== null) {
                cl = col;
                st.color = cl; st.fillColor = cl;
            }
            Colour["t" + tn] = cl;
            // if clusterType is tiddler, creating a cluster group for tiddler
            // also will have to deal with the filter / tiddler distinction
            if (clusterType[map] == "tiddler") {
                // ?todo : automate cluster creation?
                fCluster["t" + tn] = L.markerClusterGroup({
                    name: "Cluster" + map + "Cluster" + tn,
                    polygonOptions: {"weight":"0.5"},
                    maxClusterRadius: clusterRadius[map],
                    /* for the record. may be a function
         function() {return (clusterRadius - 50) / 9 * Map[map].getZoom() + 50 - (clusterRadius - 50) / 9 },*/
                    iconCreateFunction: createCluster
                });
            } else {
                fCluster["t" + tn] = fCluster[map];
            }

            // case 1 : data stored in a json tiddler
            if (flds.type == "application/json") {
                // for now, assuming any json stored data is geoJson...
                var data = obj.wiki.getTiddlerText(tid);
                mapGeoJson(data, feature, fCluster["t" + tn], Colour["t" + tn], mark, st);
                feat.addLayer(feature);
            }
            // case 2 if tiddler is not JSON data, display tiddler stored geodata as point(s), polygon, polyline...
            else {
                // create the popup for base objects
                /*popup = "<h2><a href=\"#" + encodeURIComponent(flds.title) + "\">" + flds.title + "</a></h2>";
                var content = "";
                if (flds.tooltip) {
                    content += "<h3>" + flds.tooltip + "</h3>";
                }
                popup += content;*/

                // map recursively (!!! danger !!!)
                mapPlaces(obj,
                          flds,
                          feature,
                          fCluster["t" + tn],
                          null,
                          cl,
                          mark,
                          st
                         );
                feature.addTo(feat);
            }
            /*
// check if anything was rendered before binding popup
     if (wasRendered == 0) console.log("tw-leaflet-map-plugin > non geotiddler was listed and not rendered : " + flds.title);
     // add the layer to the feature
     feature.addLayer(subFeat);
     feature.addTo(Map[map]); // layer.addTo(Map[map]);
 } */
            // get layer bounds for automatic zoom
            extBounds(feature);
            tn++;
        }
        // it tiddler rendered too many times for same map. Stoping and error launch
        else $tw.utils.error("tiddler [[" + tid + "]] was rendered more than 4242 times in this map. Please double check circular dependencies...");
    }

    // map a tiddler collection
    function mapTiddlers(obj, list, feat, clust, pop, col, mark, style) {
        var Tids = list.split(" ");
        for (var td in Tids) {
            mapTiddler(obj, Tids[td], feat, clust, pop, col, mark, style);
        }
    }

    // map tiddlers with a filter
    function mapFilter(obj, filter, feat, clust, pop, col, mark, style) {
        allMarkers = [];
        try {
            iter.map.tid = 1;
            var Tids = obj.wiki.filterTiddlers(filter);
            //console.log(Tids);
            for (var td in Tids) {
                //console.log(td, Tids[td]);
                mapTiddler(obj, Tids[td], feat, clust, pop, col, mark, style);
            }
        } catch (error) {
            $tw.utils.error("sorry there was something wrong when trying to map your filter. error : " + error);
        }
    }

    // icon url creator
    function iconUrl(col, tid, m) {
        var icone = escape($tw.wiki.renderTiddler("text/html", tid).replace("$primary$", setColor(col, m)).replace("</p>", "").replace("<p>", ""));
        return ('data:image/svg+xml;charset=UTF-8,' + icone);
    }

    // create marker
    // ?todo only if there are points to display;
    function lfltIcon(col, tid, m) {
        // checking if marker is defined. Fallback to default
        if(tid === undefined || tid === null) tid = "$:/plugins/sycom/leaflet/images/marker.svg";
        else tid = "$:/plugins/sycom/leaflet/images/" + tid + ".svg";
        if($tw.wiki.getTiddler(tid) === undefined) tid = "$:/plugins/sycom/leaflet/images/marker.svg";
        // !todo  create shadow from icon by transform matrix?
        var shad = tid.split(".svg")[0] + "shadow.svg",
            shadowUrl = 'data:image/svg+xml;charset=UTF-8,' + escape($tw.wiki.getTiddlerText(shad));
        // get dimensions in tiddler
        var MarkDim = $tw.wiki.getTiddler(tid).fields.marker_dim.split(" ");
        var ShadDim = $tw.wiki.getTiddler(shad).fields.marker_dim.split(" ");
        var theIcon = L.icon({
            iconUrl: iconUrl(col, tid, m),
            iconRetinaUrl: iconUrl(col, tid, m),
            iconSize: [MarkDim[0], MarkDim[1]],
            iconAnchor: [MarkDim[2], MarkDim[3]],
            popupAnchor: [0, -MarkDim[3]],
            shadowUrl: shadowUrl,
            shadowRetinaUrl: shadowUrl,
            shadowSize: [ShadDim[0], ShadDim[1]],
            shadowAnchor: [ShadDim[2], ShadDim[3]]
        });
        return theIcon;
    }

    // set color with fallback to map color or wiki...
    function setColor(col, m) {
        if(m === undefined) m = map;
        if (col === undefined || col === null) col = Colour[m];
        if (col === undefined || col === null) col = Colour.wiki;
        return col;
    }

    // set style with fallback to map color or wiki...
    function checkStyle(sty, col) {
        if (col === undefined || col === null) {
            if(sty.color === undefined) sty.color = setColor(col, map);
            if(sty.fillColor === undefined) sty.fillColor = setColor(col, map);
        }
        else {
            sty.color = col;
            sty.fillColor = col;
        }
        return sty;
    }

    // coordinate error message
    function displayError(objectType, error) {
        $tw.utils.error("there was an error when mapping a " + objectType + " - error : " + error);
    }

    // adjust bounds to layer
    function extBounds(feat) {
        try {
            if (bounds) {
                bounds.extend(feat.getBounds());
            } else {
                if (feat.getBounds()._northEast) {
                    bounds = feat.getBounds();
                }
            }
        } catch (error) {
            $tw.utils.error("there was an error when trying to zoom on bounds. error : " + error);
        }
    }

    // cluster icon creation
    function createCluster(clust) {
        // getting back map number
        var m = this.name.split("Cluster")[1],
            t = this.name.split("Cluster")[2],
            zC = Map[m].getZoom(),
            z0,cTot,cCol,cOpa;
        // checking object density mean for the map
        if (t === undefined) {
            if (fCluster[m].z0 === undefined) fCluster[m].z0 = zC;
            z0 = fCluster[m].z0;
            if (fCluster[m].count === undefined) fCluster[m].count = 1;
            cTot = fCluster[m].count;
            cCol = setColor(Colour[m],m);
            cOpa = 0.85
        }
        else {
            if (fCluster["t" + t].z0 === undefined) fCluster["t" + t].z0 = zC;
            z0 = fCluster["t" + t].z0;
            if (fCluster["t" + t].count === undefined) fCluster["t" + t].count = 1;
            cTot = fCluster["t" + t].count;
            cCol = setColor(Colour["t" + t],m);
            cOpa = 0.65
        }
        // cluster icon size will be based on item number and zoom
        // !todo: use density to get a more "local" percentage before calculating size
        var cC = clust.getChildCount(),
            cS = 20 * Math.log(clusterRadius[m]) * (1 + Math.log(cTot)/Math.max(cTot * Math.pow(2,zC-z0),Math.log(cTot))) * (1 - 1 / ((Math.log(cTot) / cTot) * Math.pow(2,zC-z0) * cC + 1));
        if (cS < 34) cS = 34;
        var cF; // font size of cluster text
        if (cC > 9999) cF = cS / 3;
        else {if (cC > 999) cF = cS / 3.5;
        else cF = cS / 2}
        if (cF < 12) cF = 12;
        // creating icon. Checking tiddler or whole clustering before
        return new L.DivIcon({
            html: '<div style="width:' + cS + 'px;height:' + cS + 'px;font-size:' + cF + 'px;background-color:' + cCol + ';border-color:' + cCol + ';opacity:'+cOpa+'"><div><span style="line-height:' + cS + 'px;opacity:'+(cOpa+0.12)+'">' + cC + "</span></div></div>",
            className: "marker-cluster marker-cluster-" + cC,
            iconSize: new L.Point(cS, cS)
        });
    }

    // popup function for Json
    function jsonPop(feat) {
        // extracting data to create popup (all non-null data!)
        var Prop = feat.properties,
            jsontitle = "",
            jsondesc = "",
            jsonhtml = "";
        // testing if properties title or name exists
        if (Prop.name) jsontitle += Prop.name + " ";
        if (Prop.title) jsontitle += Prop.title + " ";
        if (Prop.description) jsondesc +=  Prop.description + "";
        // populating other data
        // if we got a title
        if (jsontitle !== "") {
            jsonhtml += "<h4>" + jsontitle + "</h4>";
            // if we got a description let's give it
            if (jsondesc !== "") jsonhtml += jsondesc;
            else {
                jsonhtml+= "<ul>";
                for (var p in Prop) {
                    if (Prop[p] !== null && Prop[p] !== "" && p != "name" && p != "title") jsonhtml += "<li>" + p + " : " + Prop[p] + "</li>";
                }
                jsonhtml += "</ul>";
            }
        }
        // if we have no title, giving one with first fields
        else {
            // in case we've got a description. Stop after title
            if (jsondesc !== "") {
                for (var pr in Prop) {
                    // if title is really to short (as an id), taking next field
                    if (jsontitle.length < 8) jsontitle += Prop[pr] + " ";
                    else break;
                }
                jsonhtml = "<h4>" + jsontitle + "</h4>" + jsonhtml;
            }
            else {
                for (var po in Prop) {
                    // if title is really to short (as an id), taking next field
                    if (jsontitle.length < 4) jsontitle += Prop[po] + " ";
                    else {
                        if (Prop[po] !== null && Prop[po] !== "") jsonhtml += "<li>" + po + " : " + Prop[po] + "</li>";
                    }
                }
                jsonhtml = "<h4>" + jsontitle + "</h4><ul>" + jsonhtml + "</ul>";
            }
        }
        return jsonhtml;
    }

    exports.leafmap = mapWidget;

})();
/*
MISC NOTES for later
JSON.parse(tiddler.fields.text);
var jsonData = this.wiki.getTiddlerAsJson(this.to),
*/
