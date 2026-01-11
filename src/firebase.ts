import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCfbndqg1Wuef602A-w4ovYfaaac0notnM",
    authDomain: "music-app-5b1e8.firebaseapp.com",
    projectId: "music-app-5b1e8",
    storageBucket: "music-app-5b1e8.firebasestorage.app",
    messagingSenderId: "21679659856",
    appId: "1:21679659856:web:029fd0944c57fcc6952a55",
    measurementId: "G-F0D19Q0CEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
