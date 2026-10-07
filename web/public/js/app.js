if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker Registered', reg))
        .catch((err) => console.log('Service Worker not Registered', err));
}

const RequestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();

    if(permission !== 'granted'){
        throw new Error ("Notification permission not granted"); 
    }
}

let LogoutSession = ()=>{
    sessionStorage.removeItem("loggedInUserId");
    sessionStorage.removeItem("loggedIdData");
    sessionStorage.removeItem('TripCount');
}

let CheckCred = ()=>{
    if(sessionStorage.getItem("loggedInUserId")){
        const CAR_ID = JSON.parse(sessionStorage.getItem('loggedIdData'));
        renderNewMenu(CAR_ID);
        RequestNotificationPermission();
    }
}