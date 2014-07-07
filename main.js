require([
  "dojo/json", "dojo/_base/array", "dojo/_base/connect", "dojo/number", 
  "dojo/dom-construct", "extras/Tip", 
  "esri/map", "esri/layers/FeatureLayer", "esri/dijit/Legend",
  "dojo/domReady!"],
  function(JSON, arr, conn, number, domConstruct, Tip) {
    var bounds = new esri.geometry.Extent({"xmin":-2332499,"ymin":-1530060,"xmax":2252197,"ymax":1856904,"spatialReference":{"wkid":102003}});
    window.map = new esri.Map("map", { 
      extent: bounds,
      showAttribution: false,
      slider: false
    });
    var mapLoad = conn.connect(map, "onLoad", function() {
      conn.disconnect(mapLoad);
      map.disableMapNavigation();
      map.enablePan();
    });

    window.fl = new esri.layers.FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3", {
      maxAllowableOffset: window.map.extent.getWidth() / window.map.width,
      mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
      outFields: ["STATE_NAME"],
      visible: true
    });
    // override default renderer so that states aren't drawn
    // until the gas price data has been loaded 
    fl.setRenderer(new esri.renderer.SimpleRenderer(null));

    var template = "<strong>${STATE_NAME}:  $${GAS_DISPLAY}</strong>";
    window.tip = new Tip({
      "format": template,
      "node": "legend"
    });

    var updateEnd = conn.connect(fl, "onUpdateEnd", function() {
      // get gas price data
      // using apify:  http://apify.heroku.com/resources
      // edit the apify thing:  http://apify.heroku.com/resources/53b34e28d804760002000023/edit
      conn.disconnect(updateEnd);
      var prices = esri.request({
        url: "http://apify.heroku.com/api/aaagasprices.json",
        callbackParamName: "callback"
      });
      prices.then(drawFeatureLayer, pricesError);
      
      // wire up the tip
      conn.connect(fl, "onMouseOver", window.tip, window.tip.showInfo);
      conn.connect(fl, "onMouseOut", window.tip, window.tip.hideInfo);
    });

    window.map.addLayer(fl);

    function drawFeatureLayer(data) {
      // data comes back as text from apify...parse it
      var gas = JSON.parse(data);
      // console.log("total: ", gas);
      // console.log("join prices, number of graphics: ", fl.graphics.length);

      // loop through gas price data, find min/max and populate an object 
      // to keep track of the price of regular in each state
      window.statePrices = {};
      var gasMin = Infinity;
      var gasMax = -Infinity;
      arr.forEach(gas, function(g) {
        if ( g.state !== "State" ) {
          var price = parseFloat(parseFloat(g.regular.replace("$", "")).toFixed(2));
          statePrices[g.state] = price;
          if ( price < gasMin ) {
            gasMin = price;
          }
          if ( price > gasMax ) {
            gasMax = price;
          }
        }
      });
      // format max gas price with two decimal places
      gasMax = formatDollars(gasMax);
      // add an attribute to each attribute so gas price is displayed
      // on mouse over below the legend
      arr.forEach(fl.graphics, function(g) {
        var displayValue = statePrices[g.attributes.STATE_NAME].toFixed(2);
        g.attributes.GAS_DISPLAY = displayValue;
      });
      console.log("added attrs");

      // create a class breaks renderer
      var breaks = calcBreaks(gasMin, gasMax, 4);
      // console.log("gas price breaks: ", breaks);
      var sfs = esri.symbol.SimpleFillSymbol;
      var sls = esri.symbol.SimpleLineSymbol;
      var outline = sls("solid", new dojo.Color("#444"), 1);
      var br = new esri.renderer.ClassBreaksRenderer(null, findGasPrice);
      br.setMaxInclusive(true);
      br.addBreak(breaks[0], breaks[1], new sfs("solid", outline, new dojo.Color([255, 255, 178, 0.75])));
      br.addBreak(breaks[1], breaks[2], new sfs("solid", outline, new dojo.Color([254, 204, 92, 0.75])));
      br.addBreak(breaks[2], breaks[3], new sfs("solid", outline, new dojo.Color([253, 141, 60, 0.75])));
      br.addBreak(breaks[3], gasMax, new sfs("solid", outline, new dojo.Color([227, 26, 28, 0.75])));

      fl.setRenderer(br);
      // redraw, unlike refresh, re-renders features w/o a server roundtrip
      fl.redraw();

      var legend = new esri.dijit.Legend({
        map: window.map,
        layerInfos: [{ "layer": fl, "title": "Regular Gas" }]
      },"legend");
      legend.startup();

      // remove the loading div
      domConstruct.destroy("loading");
    }
    
    // function used by the class breaks renderer to get the
    // value used to symbolize each state
    function findGasPrice(graphic) {
      var state = graphic.attributes.STATE_NAME;
      return statePrices[state];
    }

    function calcBreaks(min, max, numberOfClasses) {
      var range = (max - min) / numberOfClasses;
      var breakValues = [];
      for ( var i = 0; i < numberOfClasses; i++ ) {
        breakValues[i] = formatDollars(min + ( range * i ));
      }
      // console.log("break values: ", breakValues);
      return breakValues;
    }

    function formatDollars(num) {
      return number.format(num, { "places": 2 });
    }
    
    function pricesError(e) {
      console.log("error getting gas price data: ", e);
    }
  }
);