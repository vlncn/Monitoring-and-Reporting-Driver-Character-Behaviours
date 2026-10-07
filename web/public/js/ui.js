const Cars = document.querySelector('.cars');
const Side_Menu = document.querySelector('.side-menu')
const Maps = document.querySelector('.maps');
const Chart_Legend = document.querySelector('.chart-legend');
const H1story = document.querySelector('.history');
/**
 * @param  {H.Map} map
 */

document.addEventListener('DOMContentLoaded', function() {
  // nav menu
  const menus = document.querySelectorAll('.side-menu');
  M.Sidenav.init(menus, {edge: 'right'});
  // add recipe form
  const forms = document.querySelectorAll('.side-form');
  M.Sidenav.init(forms);
  // Report Behaviour and Violation
  var elems = document.querySelectorAll('.collapsible');
  M.Collapsible.init(elems);
  // History
  var modal = document.querySelectorAll('.modal');
  M.Modal.init(modal);
});

const isCollapsibleActive = () => {
  const activeItem = document.querySelector('.collapsible .active');
  return activeItem !== null;
};

const renderNewMenu = (data) => {
  const html_Menu = `
    <li><a class="subheader">Caracter</a></li>
    <li>
      <div class="rower row">
        <div class="col">
          <i class="material-icons large">account_circle</i>
        </div>
        <div class="col">
          <div class="rower row medium title center-align">${data.firstName} ${data.lastName}</row>
          <div class="rower row medium">${data.email} </row>
        </div>
      </div>
    </li>
    <li><a href="/pages/homepage.html" class="waves-effect">Home</a></li>
    <li><a href="/pages/history.html" class="waves-effect">History</a></li>
    <li><a id="signOut" href="/" onclick='LogoutSession()' class="waves-effect" >Sign out</a></li>
    <li><div class="divider"></div></li>
    </li>
  `;
  Side_Menu.innerHTML = html_Menu;
};
const RenderCarDetails = (data_gsm, data_account) => {
  let hashmap = {
    0: "Aggresive",
    1: "Tenang",
    2: "Slow"
  }
  const html_car=`<div class="cars container grey-text text-darken-1">
    <h6 class="center">Monitoring</h6>
    <div class="card-panel recipe white row">
      <i class="material-icons medium center">directions_car</i>
      <div class="cars-details">
        <div class="cars-name">${data_account.car_name}</div>
        <div class="cars-character">${hashmap[data_gsm.Karakter]}</div>
      </div>
      <div  class="cars-speed">${data_gsm.Kecepatan.toFixed(2)} km/h</div>
      <div></div>
      <div></div>
      <div class="cars-tools">
        <img src="../img/bat.png">
        <span placeholder=class="cars-battery_level"> ${data_gsm.Battery_Level} %</span>
        <img src="../img/sig.png">
        <span class="cars-cell_str"> ${data_gsm.Cellular_Strength} dBm</span></div>
    </div>
  </div>`;

  Cars.innerHTML = html_car;
};

const AddViolation = () => {
  T_Violate = document.getElementById("TotalViolation");  
  T_Violate.innerText++;
}

// Function to create and update the Pie Chart
const createChart = (obj_Char) => {
  const ctx = document.getElementById('myChart').getContext('2d');
  const xValues = Object.values(obj_Char).map(item => item.Name);
  const yValues = Object.values(obj_Char).map(item => item.size);
  const PieColor = ["#d32f2f", "#43a047","#1565c0"];

  myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: xValues,
      datasets: [{
        data: yValues,
        backgroundColor: PieColor
      }]
    },
    options: {
        legend : {
          display : false
        },
      responsive: true
    }
  });
};

const updateChart = (obj_Char) => {
  if (myChart) {
    const yValues = Object.values(obj_Char).map(item => item.size);
    myChart.data.datasets[0].data = yValues;
    myChart.update();
  }
};

window.addEventListener('resize', function () {
  if (myChart != null) {myChart.resize();}
 
});

// Render Chart Legend

const RenderLegend = (obj_Char)=>{
  const Total_Size = obj_Char[0].size + obj_Char[1].size + obj_Char[2].size;
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

// Render Car Location

const RenderCarLocation = (data_gsm)=>{
  const html_map =`<div class="maps container black-text">
    <h6 class="center">Location</h6>
    <div class="center cars-update-time">Last Updated : ${data_gsm.Timestamp}</div>
  </div>`;

  Maps.innerHTML= html_map;
}

const signUpButton=document.getElementById('signUpButton');
const signInButton=document.getElementById('signInButton');
const signInForm=document.getElementById('signIn');
const signUpForm=document.getElementById('signup');
if (signUpButton || signInButton != null){
  signUpButton.addEventListener('click',function(){
    signInForm.style.display="none";
    signUpForm.style.display="block";
    document.title="Register";
  })
  signInButton.addEventListener('click', function(){
      signInForm.style.display="block";
      signUpForm.style.display="none";
      document.title="Login";
  })
}



window.addEventListener('load', CheckCred)
