jsgeo-2013-gas-prices
=====================

The simple app in this repo is used as an example of two features that are available starting with version 3.3 of the ArcGIS API for JavaScript:
- Basemap-less maps (only vector features, no tiled basemap)
- Using a function with a renderer to symbolize features (more on this below)

The app also shows using data from a 3rd party. In this case, [APIfy](http://apify.heroku.com/resources) is being used to scrape daily gas price data from a [AAA website](http://fuelgaugereport.opisnet.com/sbsavg.html). Data is accessed using [esri.request](http://help.arcgis.com/en/webapi/javascript/arcgis/jsapi/#namespace_esri/esri.request), which is single interface to do XHRs (all verbs) and JSONP.

A basemap-less map is created by adding only a feature layer or a graphics layer to an instance of [esri.Map](http://help.arcgis.com/en/webapi/javascript/arcgis/jsapi/#map). If the map doesn't have a spatial reference, it will use the spatial reference of the first layer added. In this example, when the map is created, an extent is supplied with a spatial reference in Albers (wkid:  102003). Doing this sets the map's spatial reference and in turn causes features to be requested in Albers. Because an ArcGIS Server feature service is being used, features are reprojected on the server and then sent to the client. The result is a map of the United States in Albers with all the features you'd expect from a slippy map.

Sidenote:  to generate an extent in any [spatial](http://help.arcgis.com/en/webapi/javascript/arcgis/jshelp/pcs.htm) [reference](http://help.arcgis.com/en/webapi/javascript/arcgis/jshelp/gcs.htm) with a wkid supported by the ArcGIS API for JavaScript, use the [feature layer in any spatial reference sample](http://help.arcgis.com/en/webapi/javascript/arcgis/jssamples/#sample/fl_any_projection).

Features are symbolized by average gas price. This data is published daily by AAA. Once the app has retrieved data from AAA, rather than joining it to the features, the feature layer's renderer looks up the gas price for each state according to the state name. The details behind this are that instead of giving a renderer an attribute name to symbolize features, a function is given to the renderer. This function runs once for each feature in the layer and returns a value that is then used to symbolize a feature. For this app, the function looks up a the average state gas price from the AAA data and returns it. This is a simple example but it shows that anything you can do in a function, you can now do to calculate a value to symbolize features on a map.

This app was presented at [JS.geo 2013](http://geojs.eventbrite.com/) as a lightning talk.