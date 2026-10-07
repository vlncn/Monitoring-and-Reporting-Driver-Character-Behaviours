// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getDatabase, onValue, ref, onChildAdded, onChildRemoved, set, get, child } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

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
const auth = getAuth(app);
const Refre = ref(db);


// Auth Stuff
function showMessage(message, divId){
  var messageDiv=document.getElementById(divId);
  messageDiv.style.display="block";
  messageDiv.innerHTML=message;
  messageDiv.style.opacity=1;
  setTimeout(function(){
      messageDiv.style.opacity=0;
  },5000);
}

const signUp=document.getElementById('submitSignUp');
signUp.addEventListener('click', (event)=>{
  event.preventDefault();
  const email=document.getElementById('rEmail').value;
  const password=document.getElementById('rPassword').value;
  const firstName=document.getElementById('fName').value;
  const lastName=document.getElementById('lName').value;
  const Car_Name=document.getElementById('Car_name').value;
  const ID_Device=document.getElementById('ID_uno').value;
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential)=>{
      const user=userCredential.user;
      const userData={
          email: email,
          firstName:firstName,
          lastName:lastName,
          Car_Name:Car_Name,
          Device_ID:ID_Device
      };
      showMessage('Account Created Successfully', 'signUpMessage');
      set(ref(db, "Users/" + user.uid), userData)
      .then((result)=>{
          window.location.assign('/pages/login.html');
      })
      .catch((error)=>{
          console.error("error writing document", error);

      });
  })
  .catch((error)=>{
      const errorCode=error.code;
      console.log(errorCode);
      if(errorCode=='auth/email-already-in-use'){
          showMessage('Email Address Already Exists !!!', 'signUpMessage');
      }
      else{
          showMessage('Unable to create User', 'signUpMessage');
      }
  })
});

const signIn=document.getElementById('submitSignIn');
signIn.addEventListener('click', (event)=>{
   event.preventDefault();
   const email=document.getElementById('email').value;
   const password=document.getElementById('password').value;
   const auth=getAuth();

   signInWithEmailAndPassword(auth, email,password)
   .then((userCredential)=>{
       showMessage('login is successful', 'signInMessage');
       const user=userCredential.user;
       get(child(Refre, "Users/" + user.uid)).then((snap)=> {   
            sessionStorage.setItem('loggedIdData', JSON.stringify({
                firstName : snap.val().firstName,
                lastName : snap.val().lastName,
                email : snap.val().email,
                ID_Device: snap.val().Device_ID,
                car_name : snap.val().Car_Name
       }))
})
       sessionStorage.setItem('loggedInUserId', user.uid);
       window.location.assign('homepage.html');
   })
   .catch((error)=>{
       const errorCode=error.code;
       if(errorCode==='auth/invalid-credential'){
           showMessage('Incorrect Email or Password', 'signInMessage');
       }
       else{
            console.log(errorCode);
           showMessage('Account does not Exist', 'signInMessage');
       }
   })
});
