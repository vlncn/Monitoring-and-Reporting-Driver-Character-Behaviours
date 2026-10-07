const API = API_KEY_MAP;
/**
 * Create markers
 */
function createMarkers(GPS) {
  if (map.getObjects().length !== 0){
    Previous_GPS = map.getObjects()[0].$l;
  }
    // create SVG Dom Icon
    var svg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" width="10px" height="10px">
    <circle cx="5" cy="5" r="4" fill="blue" stroke-width="1" stroke="black" opacity="1"/>
</svg>`,
      domIcon = new H.map.DomIcon(svg),
      markers = [];
      // create markers
      markers.push(new H.map.DomMarker({lat: GPS.Latitude, lng: GPS.Longitude}, {
        icon: domIcon
}));
    
    // add markers to map while removing active
    map.removeObjects(map.getObjects());
    map.addObjects(markers);

    // update markers positions
    updateMarkerPositions();
    /**
     * update all markers' positions with animation using the ease function
     */
    function updateMarkerPositions() {
      markers.forEach(function(marker) {
        // get random position 0 - 450km from map's center in random direction
        let nextPoint = {lat: GPS.Latitude, lng: GPS.Longitude};
        // update marker's position within ease function callback
          ease(
            marker.getGeometry(),
            nextPoint,
            4000,
            function(coord) {
              marker.setGeometry(coord);
              map.setCenter(coord);
            }
          )
        
      })
    }
}

    /**
     * Ease function
     * @param   {H.geo.IPoint} startCoord   start geo coordinate
     * @param   {H.geo.IPoint} endCoord     end geo coordinate
     * @param   number durationMs           duration of animation between start & end coordinates
     * @param   function onStep             callback executed each step
     * @param   function onStep             callback executed at the end
     */
    function ease(
      startCoord = {lat: 0, lng: 0},
      endCoord = {lat: 1, lng: 1},
      durationMs = 200,
      onStep = console.log,
      onComplete = function() {},
    ) {
      var raf = window.requestAnimationFrame || function(f) {window.setTimeout(f, 16)},
          stepCount = durationMs / 16,
          valueIncrementLat = (endCoord.lat - startCoord.lat) / stepCount,
          valueIncrementLng = (endCoord.lng - startCoord.lng) / stepCount,
          sinValueIncrement = Math.PI / stepCount,
          currentValueLat = startCoord.lat,
          currentValueLng = startCoord.lng,
          currentSinValue = 0;
    
      function step() {
        currentSinValue += sinValueIncrement;
        currentValueLat += valueIncrementLat * (Math.sin(currentSinValue) ** 2) * 2;
        currentValueLng += valueIncrementLng * (Math.sin(currentSinValue) ** 2) * 2;
    
        if (currentSinValue < Math.PI) {
          onStep({lat: currentValueLat, lng: currentValueLng});
          raf(step);
        } else {
          onStep(endCoord);
          onComplete();
        }
      }
    
      raf(step);
    }
    
/**
 * Boilerplate map initialization code starts below:
 */

// set up containers for the map  + panel
var mapContainer = document.getElementById('map'),
  routeInstructionsContainer = document.getElementById('panel');

//Step 1: initialize communication with the platform
// In your own code, replace variable window.apikey with your own apikey
var platform = new H.service.Platform({
  apikey: API
});

var defaultLayers = platform.createDefaultLayers();

//Step 2: initialize a map - this map is centered over Berlin
var map = new H.Map(mapContainer,
  defaultLayers.vector.normal.map,{
  center: {lat: -2.548926, lng: 118.0148634},
  zoom: 16,
  pixelRatio: (window.devicePixelRatio && window.devicePixelRatio > 1) ? 2 : 1
});
// add a resize listener to make sure that the map occupies the whole container
window.addEventListener('resize', function () {
  map.getViewPort().resize();
});

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);
  