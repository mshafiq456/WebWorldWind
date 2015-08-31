/**
 * Created by Shafiq on 8/14/2015.
 */

/*
* This main file should always be called from the main HTML file AFTER the webworldwind library has been loaded.
* This takes LayerManger, UGSDataRetriever, and PlacemarksAndPicking as a dependency.
* Thus the script inside the module is only loaded after all the dependencies have finished loading.
 */

//Note: LayerManager.js is part of www API.

define(['http://worldwindserver.net/webworldwind/worldwindlib.js',
    'http://worldwindserver.net/webworldwind/examples/LayerManager.js',
    'UGSDataRetriever',
    'PlacemarksAndPicking',
    'barGraphRepresentation'],function(ww,LayerManager,EarthQuakeRetrieval,createPlaceMarks,barGraphRepresentation)
{
    'use strict';

    // instantiate the sliders
        var magnitudeSlider = new Slider('#magnitudeSlider', {
            formatter: function (value) {
                return 'Current value: ' + value;
            }
        });

        var ageSlider = new Slider('#ageSlider', {
           formatter: function (value){
               if(value != 80)
                    return  value + 'hours';
               else
                return "All Available Data"
           }
        });

    var wwd;    // This will be the global WorldWindow Object

    // Register an event listener to be called when the page is loaded.
    window.addEventListener("load", eventWindowLoaded, false);

    var cb = new Codebird;

    cb.setConsumerKey("VddGNUN9GWxbbKBoHDzhNRjjo","noC4s8BEKQCu4gZoXx2E13CYWzbA7gUjL9dM35IwJLtErfKTjb");
    cb.setToken("3416857132-Fv8A8BIrbb7OGYoUODrfDb8bDvqhu1OBbusFzgj","24qSgQIOfVBWiSudRI1GX9EivqrneqOqlG3c42gdA20Ny");






// Define the event listener to initialize Web World Wind.
    function eventWindowLoaded() {
        // Create a World Window for the canvas.
        wwd = new WorldWind.WorldWindow("canvasOne");

        // Add some image layers to the World Window's globe.
        var layers = [
            {layer: new WorldWind.BMNGLayer(), enabled: false},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
            {layer: new WorldWind.BingAerialLayer(null), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
            {layer: new WorldWind.OpenStreetMapImageLayer(), enabled: false},
            {layer: new WorldWind.CompassLayer(), enabled: true},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];

        // Create those layers.
        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Create the Layer Manager to enable user to select certain layers.
        var layerManager= new LayerManager(wwd);


        var earthQuakes =  new EarthQuakeRetrieval();
        var placeMark = new createPlaceMarks(wwd, earthQuakes);
        var barGraph = new barGraphRepresentation(wwd, earthQuakes);




        var params = {
            status: placeMark.getInformationToDisplay(earthQuakes[0])
        };
        cb.__call(
            "statuses_update",
            params,
            function (reply) {
                //Currently we don't need to do anything with the reply received from twitter in JSON format.
                console.log(reply);
            }
        );

        //Function to perform on slider stop
        magnitudeSlider.on('slideStop', function(value){
            //value is the new value for this slider
            slideFunction();
        });
        ageSlider.on('slideStop', function(value){
            //value is the new value for this slider
            slideFunction();
        });
    }

    /*   -----------------------------------------------------------------------
     @Description: This function will be called whenever user modifies either of the slider
      It retrieves the new values for the slider and modifies the content displayed on globe according
      to those values.

     @Param: NONE
     @return:  NONE

     --------------------------------------------------------------------------------*/

    function slideFunction() {

        var minMag = magnitudeSlider.getValue();
        var maxAge = ageSlider.getValue();

        // If maxAge=80 represent user wanting to display all available data
        // so we set the maximum age to a month because thats pretty much all the data we will ever have
        //  from our current USGS server at any given moment
        if(maxAge ==80) maxAge = 24*31;

        console.log(minMag);

        var layerPlacemarks, layer3DGraphData;
        for (var i = 0; i < wwd.layers.length; i++) {

            if (wwd.layers[i].displayName == "Placemarks") {
                layerPlacemarks = wwd.layers[i];

            }
            else if(wwd.layers[i].displayName == "3D EarthQuake View") {
                layer3DGraphData = wwd.layers[i];
            }
        }

        for(var i = 0; i <layerPlacemarks.renderables.length; i++) {

            var magnitudeCondition =  layerPlacemarks.renderables[i].magnitude >= minMag;
            var ageCondition = layerPlacemarks.renderables[i].ageInHours <= maxAge;

            // A certain renderable is enabled if its magnitude value is greater or equal to the slider value
                // AND its ageInHours is less than or equal the maximum age selected by user
            layerPlacemarks.renderables[i].enabled = ( magnitudeCondition && ageCondition);

        }

        for(var i = 0; i <layer3DGraphData.renderables.length; i++) {

            var magnitudeCondition =  layer3DGraphData.renderables[i].magnitude >= minMag;
            var ageCondition = layer3DGraphData.renderables[i].ageInHours <= maxAge;

            // A certain renderable is enabled if its magnitude value is greater or equal to the slider value
                // AND its ageInHours is less than or equal the maximum age selected by user

            layer3DGraphData.renderables[i].enabled = ( magnitudeCondition && ageCondition)

        }

    };



    /*   -----------------------------------------------------------------------
     @Description: This function will be called when user clicks on "3D" data view option
         This function will disable "Placemark" layer, and will enable "3D EarthQuake View" layer

     @Param: NONE
     @return:  NONE

     --------------------------------------------------------------------------------*/
    function layer3DSelected() {
        for (var i = 0; i < wwd.layers.length; i++) {

            if (wwd.layers[i].displayName == "Placemarks") {
                wwd.layers[i].enabled = false;

            }
            else if (wwd.layers[i].displayName == "3D EarthQuake View") {
                wwd.layers[i].enabled = true;
            }
        }

    }

    /*   -----------------------------------------------------------------------
     @Description: This function will be called when user clicks on "2D" data view option
     This function will enable "Placemark" layer, and will disable "3D EarthQuake View" layer

     @Param: NONE
     @return:  NONE

     --------------------------------------------------------------------------------*/
    function layer2DSelected() {
        for (var i = 0; i < wwd.layers.length; i++) {

            if (wwd.layers[i].displayName == "Placemarks") {
                wwd.layers[i].enabled = true;

            }
            else if (wwd.layers[i].displayName == "3D EarthQuake View") {
                wwd.layers[i].enabled = false;
            }
        }

    }

    document.getElementById("layer3D").onclick = layer3DSelected;
    document.getElementById("layer2D").onclick = layer2DSelected;



});
