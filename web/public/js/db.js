// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, onValue, ref, onChildAdded, onChildChanged, query, get, child, limitToLast, set } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
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

// Database Stuff
get(query(child(ref(db), CAR_ID.ID_Device), limitToLast(1))).then((snap)=> {
  Current_trip = Object.keys(snap.val());
 }).then(() =>{
  const NewRef = ref(db, CAR_ID.ID_Device + "/" + Current_trip);
  onChildAdded(query(NewRef, limitToLast(1)),(snap2=> {
    RenderCarDetails(snap2.val(), CAR_ID);
    RenderCarLocation(snap2.val());
    createMarkers(snap2.val());
  }));
  // Count the Report and Add Violation if violated
  onChildAdded(NewRef, (snapshot)=>{
    updateCounter(snapshot.val().Karakter);
    // getSpeedLimit(snapshot.val(), snapshot.key);
    onChildChanged((ref(db, CAR_ID.ID_Device + "/" + Current_trip + snapshot.key)), (snapshot2) =>{
      if(snapshot2.val().Violation){
        AddViolation();
        new Notification("Speed Limit Violation",{
          body : `There's a speed limit violation. The car is driving ${snapshot2.val().Kecepatan} km/h`
        })
      };
      });
  });
});


// Add Violation to Unique ID of Data
const isViolation = (data, SpeedLimit, uqid) => {
  if(data.Kecepatan > SpeedLimit){
    let ViolateRef = ref(db, CAR_ID.ID_Device + "/" + Current_trip + "/" + uqid);
    set((ViolateRef), {
      Karakter:data.Karakter,
      Kecepatan:data.Kecepatan,
      Timestamp:data.Timestamp,
      Battery_Level:data.Battery_Level,
      Cellular_Strength:data.Cellular_Strength,
      Latitude:data.Latitude,
      Longitude:data.Longitude,
      Violation: true
    }
  )
  }
}

//GET SPEED LIMIT
// Fetch Speed Limit + Geolocate
async function getSpeedLimit(GPS, uqid){
  // Geolocate
  const response = await fetch(`https://revgeocode.search.hereapi.com/v1/revgeocode?at=${GPS.Latitude},${GPS.Longitude}&apiKey=9uF8N6bSNibU1yU3-VenIfDwyro7W-RvvOcFMow13Xo`);
  const data = await response.json();
  const Geocode_Coord = data.items[0].access[0];

  // Real Speed Limit
  // ${Geocode_Coord.lat},${Geocode_Coord.lng}
  const response1 = await fetch(`https://routematching.hereapi.com/v8/match/routelinks?apikey=9uF8N6bSNibU1yU3-VenIfDwyro7W-RvvOcFMow13Xo&waypoint0=${Geocode_Coord.lat},${Geocode_Coord.lng}&mode=fastest;car&routeMatch=1&attributes=SPEED_LIMITS_FCn(*)`);
  const data1 = await response1.json();
  const SpeedLimit = {
    "From" : 0,
    "To" : 0,
    "Default" : 20
  }
  if('attributes' in data1.response.route[0].leg[0].link[0]){
    SpeedLimit["From"] = +data1.response.route[0].leg[0].link[0].attributes.SPEED_LIMITS_FCN[0].FROM_REF_SPEED_LIMIT;
    SpeedLimit["To"] = +data1.response.route[0].leg[0].link[0].attributes.SPEED_LIMITS_FCN[0].TO_REF_SPEED_LIMIT;
  }
  let Real_SL = Math.max(SpeedLimit["From"], SpeedLimit["Default"], SpeedLimit["To"]);
  isViolation(GPS, Real_SL, uqid);
}


// Reporting Karakter
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
createChart(obj_Char);
const updateCounter = (keyValue) => {
  if (obj_Char[keyValue]) {
      obj_Char[keyValue].size++;
  } else {
      obj_Char[keyValue].size = 1;
  }
  updateChart(obj_Char);
  RenderLegend(obj_Char);
};