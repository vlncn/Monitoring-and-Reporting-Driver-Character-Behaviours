/************************************** Database **************************************/
// GET FIREBASE DATA //
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, query, get, child,} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: API_KEY_FIREBASE,
  authDomain: "iot-behaviour-driving.firebaseapp.com",
  databaseURL: "https://iot-behaviour-driving-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-behaviour-driving",
  storageBucket: "iot-behaviour-driving.appspot.com",
  messagingSenderId: "991576901963",
  appId: "1:991576901963:web:06d758a2a5d94ddd4e80ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const CAR_ID = JSON.parse(sessionStorage.getItem('loggedIdData'));
let Current_trip = null;
let obj_Char = {
    "0":{"Name": "Aggresive",
        "size" : 0
    },
    "1":{"Name": "Normal",
        "size" : 0
    },
    "2":{"Name": "Slow",
        "size" : 0
    }
};
// QUERY FIRST AND LAST DATA TO GET TIMESTAMP AND COORDS//
get(child(ref(db), CAR_ID.ID_Device)).then((snap)=> {
    Current_trip = Object.keys(snap.val());
    Current_trip.forEach((TripCounter) =>{
        renderSelectHistory(TripCounter) 
    })
   });
// GET ALL CHAR, SPEED, COORDS //
async function ReadAllData(Counter){
    const snapshot = await get(child(ref(db), CAR_ID.ID_Device + "/" + Counter))
    const DATA ={
        "char":[],
        "coords":[],
        "speed":[],
        "timestamp":[]
    }
    await snapshot.forEach(element => {
        updateCounter(element.val().Karakter)
        DATA["timestamp"].push(element.val().Timestamp)
        DATA["coords"].push([element.val().Latitude,element.val().Longitude]);
        DATA["char"].push(element.val().Karakter);
        DATA["speed"].push(element.val().Kecepatan);
    });
    let avg_speed = DATA["speed"].reduce((p,c,_,a)=> p+c/a.length,0);
    RenderHistoryData(avg_speed, Counter, DATA["timestamp"]);
    createChart(obj_Char);
    CreateMapInstances(DATA);
    updateChart(obj_Char);
    RenderLegend_History(obj_Char);
}
// FUNCTION COUNT DUPLICATE CHARACTER //
// Reporting Karakter
const updateCounter = (keyValue) => {
    if (obj_Char[keyValue]) {
        obj_Char[keyValue].size++;
    } else {
        obj_Char[keyValue].size = 1;
    }
  };






/************************************** MAP **************************************/
// MAKE A POLY LINER INSTANCE USING DATA FROM FIREBASE //
function CreateMapInstances(DATA) {
  var platform = new H.service.Platform({
    apikey: "9uF8N6bSNibU1yU3-VenIfDwyro7W-RvvOcFMow13Xo"
  });
  var defaultLayers = platform.createDefaultLayers();

  let lati = [];
  let longi = [];
  DATA["coords"].forEach(x =>{
    lati.push(x[0]);
    longi.push(x[1]);
  })
  let avg_lat = lati.reduce((p,c,_,a)=> p+c/a.length,0);
  let avg_lng = longi.reduce((p,c,_,a)=> p+c/a.length,0);
  var map = new H.Map(document.getElementById('maphistory'),
    defaultLayers.vector.normal.map,{
    center: {lat:avg_lat, lng:avg_lng},
    zoom: 15,
    pixelRatio: (window.devicePixelRatio && window.devicePixelRatio > 1) ? 2 : 1
  });
  // add a resize listener to make sure that the map occupies the whole container
  window.addEventListener('resize', () => map.getViewPort().resize());
  
  //Step 3: make the map interactive
  // MapEvents enables the event system
  // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  var ui = H.ui.UI.createDefault(map, defaultLayers);
  
  // Now use the map as required...
  addPolylineToMap(map, DATA["coords"]);

/**
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */
function addPolylineToMap(map, coords) {
    var lineString = new H.geo.LineString();
    
    coords.forEach(function(pos){
        lineString.pushPoint({lat:pos[0], lng:pos[1]});
    })
  
    map.addObject(new H.map.Polyline(
      lineString, { style: { lineWidth: 4 }}
    ));
  };
}



/************************************** UI **************************************/
const H1story = document.querySelector('.history-panel');
H1story.addEventListener('click', (event) =>{
    ReadAllData(event.target.innerText)
})
function renderSelectHistory(counter){
    const html_history=`<div class="col s1">  
                <button class="btn waves-effect black-text white">${counter}</button>
            </div>`;
    H1story.innerHTML += html_history;
}
function RenderHistoryData(avg_speed, Counter, Time){

    let History_data = document.querySelector('.history-info');
    const html_render_history = `<h5 class="center-align">Trip Report No. ${Counter}</h5>
    <p>
    <h6 class="center-align">${Time[0]} - ${Time[Time.length-1]} </h6>
    <div class ="card-history-panel-grid white row">
        <div class="icon"><i class="material-icons medium center-align">directions_car</i></div>
        <div class="info">
            <div>Car Name : ${CAR_ID.car_name}</div>
            <div> Average Speed : ${avg_speed.toFixed(2)} km/h</div>
        </div>
    </div>
    <div class="chart-history white row"> 
    <div class="row" style="margin-left: 2%; font-weight: bold; margin-bottom: 1.5%;"><h6>Report Karakter</h6></div>
    <div class="divider"></div>
    <div class="white row row-vertical-center">
        <div class="col s6">
            <canvas id="myChart" style="
            height: 25%;
            width: 100%; 
            justify-self: center;
            margin-top: 2px;
            align-self: center;
            "></canvas>
        </div>
        <div class="col s6">
            <div class="chart-legend-wrapper">
            <div class="chart-legend">
            </div>
            </div>
        </div>
        </div>
        </div>
    <!-- MAPS -->
    <div class="maps container black-text">
      <div class="gps-maps-here container">
        <div id="maphistory"></div>
        </div>
        <div class="container">
            <div class="row">
            </div>
        </div>
    </div> 
</p>`;

History_data.innerHTML = html_render_history;
}

const RenderLegend_History = (obj_Char)=>{
    const Total_Size = obj_Char[0].size + obj_Char[1].size + obj_Char[2].size;
    let Chart_Legend = document.querySelector('.chart-legend');
    const html_legend =`<div class="chart-legend">
                        <ul>
                          <li>
                            <span style="background-color:#1565c0;" class="dot"></span>
                            <span class="Label">${obj_Char[2].Name}</span>
                            <span class="value">${((obj_Char[2].size/Total_Size)*100).toFixed(2)} %</span>
                          </li>
                          <li>
                            <span style="background-color:#43a047;" class="dot"></span>
                            <span class="Label">${obj_Char[1].Name}</span>
                            <span class="value">${((obj_Char[1].size/Total_Size)*100).toFixed(2)} %</span>
                          </li>
                          <li>
                            <span style="background-color:#d32f2f;" class="dot"></span>
                            <span class="Label">${obj_Char[0].Name}</span>
                            <span class="value">${((obj_Char[0].size/Total_Size)*100).toFixed(2)} %</span>
                          </li>
                        </ul>
                      </div>`;
  
    Chart_Legend.innerHTML = html_legend;
  }